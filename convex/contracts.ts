import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Internal mutations called by chain actions to sync state.
 */

export const confirmDeposit = internalMutation({
    args: {
        matchId: v.id("matches"),
        txHash: v.string(),
    },
    handler: async (ctx, args) => {
        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        if (match.status !== "proposed" && match.status !== "negotiating") {
            // Idempotency check: if already verified, ignore or throw?
            if (match.status === "in_progress") return;
            throw new Error(`Invalid match status: ${match.status}`);
        }

        await ctx.db.patch(args.matchId, {
            status: "in_progress", // Funds secured, start work
            transactionHash: args.txHash,
            escrowAddress: "0x...", // We ideally parse this from logs or known address
        });

        // Create transaction record
        await ctx.db.insert("transactions", {
            matchId: args.matchId,
            amount: 0, // Should be fetched from match or args
            currency: "USDC", // Should be fetched
            type: "escrow_deposit",
            txHash: args.txHash,
            status: "confirmed",
            createdAt: Date.now(),
            confirmedAt: Date.now(),
        });
    },
});

export const confirmRelease = internalMutation({
    args: {
        matchId: v.id("matches"),
        txHash: v.string(),
    },
    handler: async (ctx, args) => {
        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        if (match.status === "finalized") return;

        await ctx.db.patch(args.matchId, {
            status: "finalized",
            finalizedAt: Date.now(),
        });

        await ctx.db.insert("transactions", {
            matchId: args.matchId,
            amount: 0, // Fetch
            currency: "USDC",
            type: "release",
            txHash: args.txHash,
            status: "confirmed",
            createdAt: Date.now(),
            confirmedAt: Date.now(),
        });

        // Increment completion count for agents? (handled in reputation triggers)
    },
});
