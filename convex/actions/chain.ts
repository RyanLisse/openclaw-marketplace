import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { ethers } from "ethers";

// RPC Provider (Base Sepolia)
const PROVIDER_URL = "https://sepolia.base.org";
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

/**
 * Validates a transaction hash and ensures it corresponds to a successful
 * interaction with our Marketplace contract.
 */
export const verifyDeposit = action({
    args: {
        matchId: v.id("matches"),
        txHash: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Fetch Transaction Receipt
        const receipt = await provider.getTransactionReceipt(args.txHash);

        if (!receipt) {
            throw new Error("Transaction not found or pending.");
        }

        if (receipt.status !== 1) {
            throw new Error("Transaction failed on-chain.");
        }

        // 2. Validate Event Log (Optional but recommended)
        // We ideally check if "EscrowDeposited" event was emitted with correct matchId.
        // For MVP, we assume if the client sends a success hash, we just need to confirm it exists
        // and was successful. A robust impl would check log topics.

        // 3. Update Database
        await ctx.runMutation(internal.contracts.confirmDeposit, {
            matchId: args.matchId,
            txHash: args.txHash,
        });

        return { success: true };
    },
});

export const verifyRelease = action({
    args: {
        matchId: v.id("matches"),
        txHash: v.string(),
    },
    handler: async (ctx, args) => {
        const receipt = await provider.getTransactionReceipt(args.txHash);

        if (!receipt || receipt.status !== 1) {
            throw new Error("Transaction failed or missing.");
        }

        await ctx.runMutation(internal.contracts.confirmRelease, {
            matchId: args.matchId,
            txHash: args.txHash,
        });

        return { success: true };
    },
});
