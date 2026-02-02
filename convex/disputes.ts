import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Disputes Tool Cluster
 * Three-tier resolution system: AI -> Community -> Council.
 */

// Create Dispute (Tier 1: AI Mediation)
export const createDispute = mutation({
    args: {
        matchId: v.id("matches"),
        agentId: v.string(),
        reason: v.string(),
        evidence: v.string(),
    },
    handler: async (ctx, args) => {
        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        if (match.status === "disputed") throw new Error("Already disputed");

        // Create dispute record
        const disputeId = await ctx.db.insert("disputes", {
            matchId: args.matchId,
            initiatorAgentId: args.agentId,
            reason: args.reason,
            evidence: [args.evidence], // Simple text evidence first
            status: "open",
            tier: 1,
            createdAt: Date.now(),
        });

        // Update match status
        await ctx.db.patch(args.matchId, { status: "disputed" });

        // Trigger AI Mediation
        await ctx.scheduler.runAfter(0, internal.actions.openai.analyzeDispute, {
            disputeId,
            evidence: args.evidence,
        });

        return disputeId;
    },
});

// Cast Vote (Tier 2: Community)
export const castVote = mutation({
    args: {
        disputeId: v.id("disputes"),
        agentId: v.string(),
        vote: v.string(), // 'uphold' | 'refund'
        justification: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const dispute = await ctx.db.get(args.disputeId);
        if (!dispute || dispute.status !== "voting") throw new Error("Dispute not open for voting");

        // Check voter reputation
        const agent = await ctx.db
            .query("agents")
            .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
            .first();

        if (!agent || agent.reputationScore < 60) {
            throw new Error("Insufficient reputation to vote");
        }

        // Record Vote
        await ctx.db.insert("votes", {
            disputeId: args.disputeId,
            agentId: args.agentId,
            vote: args.vote,
            weight: agent.reputationScore,
            justification: args.justification,
            createdAt: Date.now(),
        });

        // TODO: Trigger tally check?
    },
});

// Resolve Dispute (Internal or Manual Admin)
export const resolveDispute = internalMutation({
    args: {
        disputeId: v.id("disputes"),
        resolution: v.string(),
        winnerAgentId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const dispute = await ctx.db.get(args.disputeId);
        if (!dispute) return;

        await ctx.db.patch(args.disputeId, {
            status: "resolved",
            resolution: args.resolution,
            winnerAgentId: args.winnerAgentId,
            resolvedAt: Date.now(),
            tier: dispute.tier, // Keep current tier
        });

        // Update Match
        // If 'refund', maybe set match to 'cancelled'?
        // If 'uphold', set to 'completed'?
        // This depends on the specific ruling.
    },
});
