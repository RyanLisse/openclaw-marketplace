import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query('transactions').order('desc');
    if (args.status) {
      return (await q.take(100)).filter((t) => t.status === args.status);
    }
    return await q.take(100);
  },
});

export const create = mutation({
  args: {
    matchId: v.id('matches'),
    amount: v.number(),
    currency: v.string(),
    fromAgentId: v.string(),
    toAgentId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const txId = await ctx.db.insert('transactions', {
      matchId: args.matchId,
      amount: args.amount,
      currency: args.currency,
      fromAgentId: args.fromAgentId,
      toAgentId: args.toAgentId,
      status: 'pending',
      createdAt: Date.now(),
      ...(args.metadata && { metadata: args.metadata }),
    });
    return { transactionId: txId, status: 'created' };
  },
});

export const updateStatus = mutation({
  args: {
    transactionId: v.id('transactions'),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    txHash: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.transactionId);
    if (!tx) throw new Error(`Transaction ${args.transactionId} not found`);

    const updates: any = { status: args.status };
    if (args.txHash) updates.txHash = args.txHash;
    if (args.error) updates.error = args.error;
    if (args.status === 'confirmed') updates.confirmedAt = Date.now();
    if (args.status === 'failed' || args.status === 'cancelled') {
      updates.failedAt = Date.now();
    }

    await ctx.db.patch(args.transactionId, updates);
    return { transactionId: args.transactionId, status: args.status };
  },
});

export const cancel = mutation({
  args: {
    transactionId: v.id('transactions'),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.transactionId);
    if (!tx) throw new Error(`Transaction ${args.transactionId} not found`);

    if (tx.status !== 'pending') {
      throw new Error(`Cannot cancel transaction with status ${tx.status}`);
    }

    await ctx.db.delete(args.transactionId);
    return { transactionId: args.transactionId, status: 'cancelled' };
  },
});
