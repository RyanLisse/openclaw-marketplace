/**
 * Async Operations (openclaw-marketplace-e8j)
 * create, updateProgress, complete, fail (internal); get (public query for frontend)
 */
import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';

const statusType = v.union(
  v.literal('pending'),
  v.literal('in_progress'),
  v.literal('completed'),
  v.literal('failed')
);

export const create = internalMutation({
  args: {
    operationId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('async_operations', {
      operationId: args.operationId,
      type: args.type,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
    });
    return { id, operationId: args.operationId, status: 'pending' };
  },
});

export const updateProgress = internalMutation({
  args: {
    operationId: v.string(),
    progress: v.number(),
    status: v.optional(statusType),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('async_operations')
      .withIndex('by_operation_id', (q) => q.eq('operationId', args.operationId))
      .first();
    if (!doc) throw new Error(`Operation ${args.operationId} not found`);
    if (doc.status === 'completed' || doc.status === 'failed') {
      throw new Error(`Operation ${args.operationId} is already ${doc.status}`);
    }
    await ctx.db.patch(doc._id, {
      progress: Math.min(100, Math.max(0, args.progress)),
      ...(args.status && { status: args.status }),
    });
    return { operationId: args.operationId, progress: args.progress };
  },
});

export const complete = internalMutation({
  args: {
    operationId: v.string(),
    result: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('async_operations')
      .withIndex('by_operation_id', (q) => q.eq('operationId', args.operationId))
      .first();
    if (!doc) throw new Error(`Operation ${args.operationId} not found`);
    const now = Date.now();
    await ctx.db.patch(doc._id, {
      status: 'completed',
      progress: 100,
      result: args.result,
      completedAt: now,
    });
    return { operationId: args.operationId, status: 'completed' };
  },
});

export const fail = internalMutation({
  args: {
    operationId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('async_operations')
      .withIndex('by_operation_id', (q) => q.eq('operationId', args.operationId))
      .first();
    if (!doc) throw new Error(`Operation ${args.operationId} not found`);
    const now = Date.now();
    await ctx.db.patch(doc._id, {
      status: 'failed',
      error: args.error,
      completedAt: now,
    });
    return { operationId: args.operationId, status: 'failed' };
  },
});

export const get = query({
  args: { operationId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('async_operations')
      .withIndex('by_operation_id', (q) => q.eq('operationId', args.operationId))
      .first();
    return doc ?? null;
  },
});
