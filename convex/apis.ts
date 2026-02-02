import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * API Marketplace Tool Cluster
 * Monetized agent services.
 */

// Register API: Create a new paid endpoint
export const registerApi = mutation({
    args: {
        agentId: v.string(), // Auth handled by caller usually, but explicit here
        name: v.string(),
        description: v.optional(v.string()),
        endpoint: v.string(),
        pricePerCall: v.number(),
    },
    handler: async (ctx, args) => {
        const apiId = await ctx.db.insert("apis", {
            providerId: args.agentId,
            name: args.name,
            description: args.description,
            endpoint: args.endpoint,
            pricePerCall: args.pricePerCall,
            currency: "USDC", // Default for now
            isEnabled: true,
        });
        return apiId;
    },
});

// List APIs: Marketplace discovery
export const listApis = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("apis")
            .filter(q => q.eq(q.field("isEnabled"), true))
            .take(50);
    },
});

// Record Usage: Internal mutation for billing (called by API Gateway/Proxy)
export const recordUsage = internalMutation({
    args: {
        apiId: v.id("apis"),
        consumerId: v.string(),
        cost: v.number(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("api_usage", {
            apiId: args.apiId,
            consumerId: args.consumerId,
            timestamp: Date.now(),
            cost: args.cost,
            status: args.status,
        });
    },
});
