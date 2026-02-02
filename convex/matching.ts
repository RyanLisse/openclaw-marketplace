import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Matching Tool Cluster
 * Hybrid algorithm combining vector similarity + metadata scoring.
 * Vector search requires action context; mutation handles DB writes.
 */

const WEIGHTS = {
  VECTOR: 0.4,
  REPUTATION: 0.2,
  PRICE: 0.2,
  SKILLS: 0.2,
};

export const getIntentForMatch = internalQuery({
  args: { intentId: v.id("intents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.intentId);
  },
});

export const createMatchRecord = internalMutation({
  args: {
    needIntentId: v.id("intents"),
    offerIntentId: v.id("intents"),
    score: v.number(),
    needAgentId: v.string(),
    offerAgentId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_agents", (q) =>
        q.eq("needAgentId", args.needAgentId).eq("offerAgentId", args.offerAgentId)
      )
      .first();
    if (existing) return;
    await ctx.db.insert("matches", {
      needIntentId: args.needIntentId,
      offerIntentId: args.offerIntentId,
      score: args.score,
      algorithm: "hybrid_v1",
      status: "proposed",
      needAgentId: args.needAgentId,
      offerAgentId: args.offerAgentId,
      createdAt: Date.now(),
    });
  },
});

export const findMatches = internalAction({
  args: { intentId: v.id("intents") },
  handler: async (ctx, args) => {
    const sourceIntent = await ctx.runQuery(internal.matching.getIntentForMatch, {
      intentId: args.intentId,
    });
    if (!sourceIntent || !sourceIntent.embedding) return;

    const targetType = sourceIntent.type === "need" ? "offer" : "need";

    const candidates = await ctx.vectorSearch("intents", "by_embedding", {
      vector: sourceIntent.embedding,
      limit: 20,
      filter: (q) => q.eq("type", targetType),
    });

    for (const candidateResult of candidates) {
      const candidate = await ctx.runQuery(internal.matching.getIntentForMatch, {
        intentId: candidateResult._id as Id<"intents">,
      });
      if (!candidate) continue;
      if (candidate.status !== "open") continue;

      if (candidate.agentId === sourceIntent.agentId) continue;

      const agent = await ctx.runQuery(internal.matching.getAgentByAgentId, {
        agentId: candidate.agentId,
      });
      const reputationScore = (agent?.reputationScore ?? 50) / 100;

      let priceScore = 0.5;
      if (sourceIntent.currency === candidate.currency) {
        priceScore = 0.8;
        if (
          sourceIntent.amount != null &&
          candidate.amount != null &&
          sourceIntent.amount >= candidate.amount
        ) {
          priceScore = 1;
        }
      }

      const sourceSkills = new Set(sourceIntent.skills);
      const candSkills = new Set(candidate.skills);
      const intersection = new Set([...sourceSkills].filter((x) => candSkills.has(x)));
      const union = new Set([...sourceSkills, ...candSkills]);
      const skillScore = union.size === 0 ? 0 : intersection.size / union.size;

      const vectorScore = candidateResult._score ?? 0;
      const finalScore =
        (vectorScore * WEIGHTS.VECTOR +
          reputationScore * WEIGHTS.REPUTATION +
          priceScore * WEIGHTS.PRICE +
          skillScore * WEIGHTS.SKILLS) *
        100;

      if (finalScore > 60) {
        await ctx.runMutation(internal.matching.createMatchRecord, {
          needIntentId:
            sourceIntent.type === "need"
              ? (sourceIntent._id as Id<"intents">)
              : (candidate._id as Id<"intents">),
          offerIntentId:
            sourceIntent.type === "offer"
              ? (sourceIntent._id as Id<"intents">)
              : (candidate._id as Id<"intents">),
          score: Math.round(finalScore),
          needAgentId:
            sourceIntent.type === "need"
              ? sourceIntent.agentId
              : candidate.agentId,
          offerAgentId:
            sourceIntent.type === "offer"
              ? sourceIntent.agentId
              : candidate.agentId,
        });
      }
    }
  },
});

export const getAgentByAgentId = internalQuery({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});
