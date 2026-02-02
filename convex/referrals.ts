import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Referral System Tool Cluster
 * Growth engine for the marketplace.
 */

// Generate Referral Code
export const generateCode = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        if (user.referralCode) return user.referralCode;

        // Simple code generation: Name prefix + random
        // In production, ensure uniqueness more robustly
        const prefix = (user.name || "agent").substring(0, 3).toUpperCase();
        const code = `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        await ctx.db.patch(args.userId, {
            referralCode: code,
        });

        return code;
    },
});

// Redeem Code: Called when user signs up or explicitly links
export const redeemCode = mutation({
    args: {
        userId: v.id("users"),
        code: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");
        if (user.referredBy) throw new Error("Already referred");

        // Find referrer
        const referrer = await ctx.db.query("users")
            .withIndex("by_referralCode", q => q.eq("referralCode", args.code))
            .first();

        if (!referrer) throw new Error("Invalid code");
        if (referrer._id === args.userId) throw new Error("Cannot refer self");

        // Link
        await ctx.db.patch(args.userId, {
            referredBy: referrer._id,
        });

        // Create record
        await ctx.db.insert("referrals", {
            referrerId: referrer._id,
            refereeId: user._id,
            status: "pending",
            createdAt: Date.now(),
        });

        return { success: true, referrerName: referrer.name };
    },
});

// Distribute Reward: Mocked action
export const distributeReward = internalMutation({
    args: {
        referralId: v.id("referrals"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.referralId, {
            status: "completed",
            rewardAmount: args.amount,
            paidAt: Date.now(),
        });
        // In real system: Trigger USDC transfer via `contracts` module
        console.log(`[Referral] Paid ${args.amount} USDC to referrer for ${args.referralId}`);
    },
});
