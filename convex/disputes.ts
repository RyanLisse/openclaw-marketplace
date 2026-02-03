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

// CRUD Operations

export const get = query({
    args: {
        id: v.id("disputes"),
    },
    handler: async (ctx, args) => {
        const dispute = await ctx.db.get(args.id);
        if (!dispute) throw new Error(`Dispute ${args.id} not found`);
        return dispute;
    },
});

export const list = query({
    args: {
        agentId: v.optional(v.string()),
        status: v.optional(v.string()),
        tier: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let q = ctx.db.query("disputes").order("desc");
        
        let disputes = await q.take(100);
        
        if (args.agentId) {
            disputes = disputes.filter((d) => d.initiatorAgentId === args.agentId);
        }
        if (args.status) {
            disputes = disputes.filter((d) => d.status === args.status);
        }
        if (args.tier !== undefined) {
            disputes = disputes.filter((d) => d.tier === args.tier);
        }
        
        return disputes;
    },
});

export const remove = mutation({
    args: {
        disputeId: v.id("disputes"),
        // TODO: Add authentication check for admin-only access
    },
    handler: async (ctx, args) => {
        const dispute = await ctx.db.get(args.disputeId);
        if (!dispute) throw new Error(`Dispute ${args.disputeId} not found`);

        // TODO: Check if caller is admin
        // For now, allowing removal (should add auth check in future)
        
        await ctx.db.delete(args.disputeId);
        return { disputeId: args.disputeId, status: "removed" };
    },
});
