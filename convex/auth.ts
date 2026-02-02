import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ethers } from "ethers";

/**
 * Auth Tool Cluster
 * Handles wallet-based authentication using SIWE-like flow.
 */

// Generate Nonce: Create a challenge for the user to sign
export const generateNonce = mutation({
    args: { walletAddress: v.string() },
    handler: async (ctx, args) => {
        const nonce = Math.floor(Math.random() * 1000000000).toString();
        const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes

        // Store or update nonce
        const existing = await ctx.db
            .query("auth_nonces")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { nonce, expiresAt });
        } else {
            await ctx.db.insert("auth_nonces", {
                walletAddress: args.walletAddress,
                nonce,
                expiresAt,
            });
        }

        return nonce;
    },
});

// Sign In: Verify signature and create session
export const signInWithWallet = mutation({
    args: {
        walletAddress: v.string(),
        signature: v.string(),
    },
    handler: async (ctx, args) => {
        // Get stored nonce
        const nonceRecord = await ctx.db
            .query("auth_nonces")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .first();

        if (!nonceRecord || nonceRecord.expiresAt < Date.now()) {
            throw new Error("Invalid or expired nonce. Please try again.");
        }

        // Verify signature
        const message = `Sign in to OpenClaw: ${nonceRecord.nonce}`;
        const recoveredAddress = ethers.verifyMessage(message, args.signature);

        if (recoveredAddress.toLowerCase() !== args.walletAddress.toLowerCase()) {
            throw new Error("Invalid signature.");
        }

        // Get or create user
        let user = await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .first();

        if (!user) {
            const userId = await ctx.db.insert("users", {
                walletAddress: args.walletAddress,
                createdAt: Date.now(),
            });
            user = await ctx.db.get(userId);
        }

        if (!user) throw new Error("Failed to create user");

        // Create session
        const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

        await ctx.db.insert("auth_sessions", {
            token,
            userId: user._id,
            expiresAt,
        });

        // Cleanup nonce
        await ctx.db.delete(nonceRecord._id);

        return { token, userId: user._id };
    },
});

// Validate Session: Check if token is valid (internal helper or API)
export const validateSession = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("auth_sessions")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!session || session.expiresAt < Date.now()) {
            return null;
        }

        const user = await ctx.db.get(session.userId);
        return user;
    },
});

// Sign Out: Revoke session
export const signOut = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("auth_sessions")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (session) {
            await ctx.db.delete(session._id);
        }
    },
});
