import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createIntent = mutation({
  args: {
    userId: v.string(),
    originalText: v.string(),
    parsedIntent: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("user_intents", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateIntentStatus = mutation({
  args: {
    id: v.id("user_intents"),
    status: v.union(
      v.literal("pending"),
      v.literal("preview"),
      v.literal("signed"),
      v.literal("executed"),
      v.literal("failed")
    ),
    txHash: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, status, txHash, error } = args;
    const updates: any = { status, txHash, error };
    if (args.status === "executed") {
      updates.executedAt = Date.now();
    }
    await ctx.db.patch(id, updates);
  },
});

export const listIntents = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_intents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);
  },
});

export const getIntent = query({
  args: { id: v.id("user_intents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
