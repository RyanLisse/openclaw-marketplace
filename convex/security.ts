import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

/**
 * Security Hardening Tool Cluster
 * Audit logging and rate limiting.
 */

// Log Audit Event: Immutable record of sensitive actions
export const logAudit = internalMutation({
    args: {
        action: v.string(),
        actorId: v.string(),
        resourceId: v.optional(v.string()),
        outcome: v.string(),
        metadata: v.optional(v.any()),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("audit_logs", {
            ...args,
            timestamp: Date.now(),
        });
    },
});

// Check Rate Limit (Token Bucket)
// Returns true if allowed, false if blocked
export const checkRateLimit = mutation({
    args: {
        key: v.string(), // Identifier (IP, User ID, etc.)
        capacity: v.number(), // Max tokens
        rate: v.number(), // Refill rate (tokens per second)
        cost: v.number(), // Tokens to consume
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const existing = await ctx.db.query("rate_limits")
            .withIndex("by_key", q => q.eq("key", args.key))
            .first();

        let tokens = args.capacity;
        let lastRefillAt = now;

        if (existing) {
            // Calculate refill
            const timeDalta = (now - existing.lastRefillAt) / 1000;
            const refillAmount = timeDalta * args.rate;
            tokens = Math.min(args.capacity, existing.tokens + refillAmount);
            lastRefillAt = now;
        }

        if (tokens >= args.cost) {
            // Allow
            const newTokens = tokens - args.cost;
            if (existing) {
                await ctx.db.patch(existing._id, { tokens: newTokens, lastRefillAt });
            } else {
                await ctx.db.insert("rate_limits", { key: args.key, tokens: newTokens, lastRefillAt });
            }
            return { allowed: true, remaining: newTokens };
        } else {
            // Block
            // Don't update time if blocked, to prevent "banking" time while spamming
            return { allowed: false, remaining: tokens, retryAfter: (args.cost - tokens) / args.rate };
        }
    },
});
