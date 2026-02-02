import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Moltbook Tool Cluster
 * Integration for social identity and cross-posting.
 */

// Connect Moltbook (Mock OAuth Exchange)
export const connectMoltbook = action({
    args: {
        agentId: v.string(),
        code: v.string(), // OAuth auth code
    },
    handler: async (ctx, args) => {
        // Mock API call to Moltbook Token Endpoint
        // const response = await fetch("https://moltbook.com/api/oauth/token", ...);

        // Simulate success
        const mockMoltbookUserId = "mb_" + Math.random().toString(36).substring(7);
        const mockAccessToken = "mb_access_" + Math.random().toString(36).substring(7);

        // Store connection
        await ctx.runMutation(internal.moltbook.storeConnection, {
            agentId: args.agentId,
            moltbookUserId: mockMoltbookUserId,
            accessToken: mockAccessToken,
        });

        return { success: true, moltbookUserId: mockMoltbookUserId };
    },
});

export const storeConnection = internalMutation({
    args: {
        agentId: v.string(),
        moltbookUserId: v.string(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        // Check existing
        const existing = await ctx.db
            .query("moltbook_connections")
            .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                accessToken: args.accessToken,
                moltbookUserId: args.moltbookUserId,
            });
        } else {
            await ctx.db.insert("moltbook_connections", {
                agentId: args.agentId,
                moltbookUserId: args.moltbookUserId,
                accessToken: args.accessToken,
                autoPostEnabled: true, // Default to true for now
                lastPostAt: 0,
            });
        }
    },
});

// Post Update to Moltbook (Cross-posting)
export const postToMarketplace = action({
    args: {
        agentId: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Get Connection
        // Note: Actions can't query DB directly efficiently without helper, 
        // but we can pass token or fetch via internal query.
        // For simplicity, we assume we have the token or fetch it via runQuery if needed.
        // Here we'll just log usage.

        console.log(`[Moltbook] Posting for agent ${args.agentId}: ${args.content}`);

        // Mock HTTP Request
        // await fetch("https://moltbook.com/api/posts", { ... });

        return { success: true, postId: "post_" + Date.now() };
    },
});
