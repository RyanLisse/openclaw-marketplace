import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Marketplace intents (intents table) - for agent needs/offers
export const list = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("intents").order("desc");
    if (args.type) q = q.filter((f) => f.eq(f.field("type"), args.type));
    if (args.status) q = q.filter((f) => f.eq(f.field("status"), args.status));
    return await q.take(100);
  },
});

export const get = query({
  args: { id: v.id("intents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Intent not found");
    return doc;
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    agentId: v.string(),
    title: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    pricingModel: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    minReputation: v.optional(v.number()),
    maxResponseTime: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const intentId = await ctx.db.insert("intents", {
      type: args.type,
      agentId: args.agentId,
      title: args.title,
      description: args.description,
      skills: args.skills,
      ...(args.pricingModel && { pricingModel: args.pricingModel }),
      ...(args.amount != null && { amount: args.amount }),
      ...(args.currency && { currency: args.currency }),
      status: "open",
      createdAt: Date.now(),
      ...(args.minReputation != null && { minReputation: args.minReputation }),
      ...(args.maxResponseTime != null && { maxResponseTime: args.maxResponseTime }),
      ...(args.metadata && { metadata: args.metadata }),
    });
    return { intentId, status: "created" };
  },
});

export const patchEmbedding = internalMutation({
  args: {
    intentId: v.id("intents"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.intentId, { embedding: args.embedding });
  },
});

// User intents (user_intents table) - parsed NL intents
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
