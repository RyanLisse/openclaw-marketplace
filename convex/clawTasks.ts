import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * ClawTasks Tool Cluster
 * Integration for importing bounties as marketplace intents.
 */

// Import Bounty Action
export const importBounty = action({
    args: {
        agentId: v.string(),
        bountyUrl: v.string(),
        bountyId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // 1. Fetch Bounty Details
        // Mocked request to ClawTasks API
        // const res = await fetch(`https://clawtasks.com/api/bounties/${args.bountyId}`);

        // Simulate data
        const mockBounty = {
            id: args.bountyId || "bt_" + Math.random().toString(36).substring(7),
            title: "Fix bug in parser",
            description: "Need help fixing a regex issue in the Markdown parser.",
            rewardAmount: 50,
            rewardCurrency: "USDC",
            tags: ["regex", "typescript", "bugfix"],
        };

        // 2. Create Intent via Internal Mutation
        const intentId = await ctx.runMutation(internal.clawTasks.createImportedIntent, {
            agentId: args.agentId,
            bountyData: mockBounty,
            url: args.bountyUrl,
        });

        return { success: true, intentId };
    },
});

export const createImportedIntent = internalMutation({
    args: {
        agentId: v.string(),
        bountyData: v.any(),
        url: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, title, description, rewardAmount, rewardCurrency, tags } = args.bountyData;

        // Check for duplicate
        // Could use a specific index, but for now we trust unique ID check in logic or let it create duplicates

        // Create Intent
        const intentId = await ctx.db.insert("intents", {
            type: "need", // Bounties are usually Needs
            agentId: args.agentId,
            title: `[ClawTasks] ${title}`,
            description: description, // + `\n\nOriginal Bounty: ${args.url}`,
            skills: tags,
            status: "open",
            createdAt: Date.now(),
            pricingModel: "fixed",
            amount: rewardAmount,
            currency: rewardCurrency,
            externalSource: {
                platform: "clawtasks",
                id: id,
                url: args.url,
            },
        });

        return intentId;
    },
});
