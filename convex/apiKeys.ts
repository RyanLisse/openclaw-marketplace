import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ethers } from "ethers";

/**
 * API Key Tool Cluster
 * Manages access keys for autonomous agents.
 */

// Create API Key: Generate a new key for an agent
export const create = mutation({
    args: {
        agentId: v.string(),
        label: v.optional(v.string()),
        scopes: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        // Generate a secure random key
        const rawKey = "sk_claw_" + Array.from(
            ethers.randomBytes(32)
        ).map(b => b.toString(16).padStart(2, '0')).join('');

        // Hash the key for storage
        const keyHash = ethers.keccak256(ethers.toUtf8Bytes(rawKey));

        // Store the hash
        await ctx.db.insert("api_keys", {
            keyHash,
            agentId: args.agentId,
            label: args.label,
            scopes: args.scopes,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year default
        });

        // Return the RAW key (only once)
        return {
            apiKey: rawKey,
            agentId: args.agentId,
            message: "Save this key now. It will not be shown again."
        };
    },
});

// Revoke: Delete an API key
export const revoke = mutation({
    args: { agentId: v.string(), keyHash: v.optional(v.string()) }, // Revoke specific or all
    handler: async (ctx, args) => {
        if (args.keyHash) {
            const key = await ctx.db
                .query("api_keys")
                .withIndex("by_hash", (q) => q.eq("keyHash", args.keyHash!))
                .first();

            if (key && key.agentId === args.agentId) {
                await ctx.db.delete(key._id);
            }
        } else {
            // Revoke all for agent
            const keys = await ctx.db
                .query("api_keys")
                .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
                .collect();

            for (const key of keys) {
                await ctx.db.delete(key._id);
            }
        }

        return { status: "revoked" };
    },
});

// Validate: Check if a key is valid (internal use)
export const validate = query({
    args: { apiKey: v.string() },
    handler: async (ctx, args) => {
        const keyHash = ethers.keccak256(ethers.toUtf8Bytes(args.apiKey));

        const key = await ctx.db
            .query("api_keys")
            .withIndex("by_hash", (q) => q.eq("keyHash", keyHash))
            .first();

        if (!key) return null;
        if (key.expiresAt && key.expiresAt < Date.now()) return null;

        // TODO: Update lastUsedAt (mutation needed, but this is a query for speed)
        // We might need a separate action/mutation for "useApiKey" if we want to track usage properly.

        return {
            agentId: key.agentId,
            scopes: key.scopes,
        };
    },
});
