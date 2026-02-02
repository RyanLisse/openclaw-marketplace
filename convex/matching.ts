import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Matching Tool Cluster
 * Hybrid algorithm combining vector similarity + metadata scoring.
 */

// Weights for scoring
const WEIGHTS = {
    VECTOR: 0.4,
    REPUTATION: 0.2,
    PRICE: 0.2,
    SKILLS: 0.2,
};

export const findMatches = internalMutation({
    args: {
        intentId: v.id("intents"),
    },
    handler: async (ctx, args) => {
        const sourceIntent = await ctx.db.get(args.intentId);
        if (!sourceIntent || !sourceIntent.embedding) return;

        // 1. Vector Search Candidate Generation (Top 20)
        // Find opposites: 'need' seeks 'offer', 'offer' seeks 'need'
        const targetType = sourceIntent.type === 'need' ? 'offer' : 'need';

        // Use the Search index for broad filtering by type/status first if needed,
        // but vector search is best.
        const candidates = await ctx.db.vectorSearch("intents", "by_embedding", {
            vector: sourceIntent.embedding,
            limit: 20,
            filter: (q) => q.and(
                q.eq("type", targetType),
                q.eq("status", "open")
            ),
        });

        for (const candidateResult of candidates) {
            const candidate = await ctx.db.get(candidateResult._id);
            if (!candidate) continue;

            // Avoid self-matching
            if (candidate.agentId === sourceIntent.agentId) continue;

            // 2. Metadata Scoring

            // A. Reputation Score (Normalized 0-1)
            const agent = await ctx.db
                .query("agents")
                .withIndex("by_agent_id", (q) => q.eq("agentId", candidate.agentId))
                .first();
            const reputationScore = (agent?.reputationScore || 50) / 100;

            // B. Price Compatibility (Simple overlap check)
            // Logic: If models match OR not specified, good. If currency mismatch, bad.
            let priceScore = 0.5;
            if (sourceIntent.currency === candidate.currency) {
                priceScore = 0.8;
                // If source has budget >= candidate amount
                if (sourceIntent.amount && candidate.amount && sourceIntent.amount >= candidate.amount) {
                    priceScore = 1.0;
                }
            }

            // C. Skills Overlap (Jaccard Index)
            const sourceSkills = new Set(sourceIntent.skills);
            const candSkills = new Set(candidate.skills);
            const intersection = new Set([...sourceSkills].filter(x => candSkills.has(x)));
            const union = new Set([...sourceSkills, ...candSkills]);
            const skillScore = union.size === 0 ? 0 : intersection.size / union.size;

            // 3. Final Weighted Score
            const vectorScore = candidateResult._score; // Cosine similarity (0-1)

            const finalScore = (
                (vectorScore * WEIGHTS.VECTOR) +
                (reputationScore * WEIGHTS.REPUTATION) +
                (priceScore * WEIGHTS.PRICE) +
                (skillScore * WEIGHTS.SKILLS)
            ) * 100; // Scale to 0-100

            // 4. Create Match Record if score is decent (> 60)
            if (finalScore > 60) {
                // Check if match already exists
                const existing = await ctx.db
                    .query("matches")
                    .withIndex("by_agents", (q) =>
                        q.eq("needAgentId", sourceIntent.type === 'need' ? sourceIntent.agentId : candidate.agentId)
                            .eq("offerAgentId", sourceIntent.type === 'offer' ? sourceIntent.agentId : candidate.agentId)
                    )
                    .first();

                if (!existing) {
                    await ctx.db.insert("matches", {
                        needIntentId: sourceIntent.type === 'need' ? sourceIntent._id : candidate._id,
                        offerIntentId: sourceIntent.type === 'offer' ? sourceIntent._id : candidate._id,
                        score: Math.round(finalScore),
                        algorithm: "hybrid_v1",
                        status: "proposed",
                        needAgentId: sourceIntent.type === 'need' ? sourceIntent.agentId : candidate.agentId,
                        offerAgentId: sourceIntent.type === 'offer' ? sourceIntent.agentId : candidate.agentId,
                        createdAt: Date.now(),
                    });
                }
            }
        }
    },
});
