/**
 * Config System (openclaw-marketplace-7vn)
 * get, create, update, deactivate; getConfig() helper
 */
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const get = query({
  args: {
    key: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const activeOnly = args.activeOnly ?? true;
    const doc = await ctx.db
      .query('configs')
      .withIndex('by_key_active', (q) =>
        q.eq('key', args.key).eq('isActive', activeOnly)
      )
      .first();
    return doc ?? null;
  },
});

export const create = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    version: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const version = args.version ?? 1;
    const existing = await ctx.db
      .query('configs')
      .withIndex('by_key_active', (q) => q.eq('key', args.key).eq('isActive', true))
      .first();
    if (existing) throw new Error(`Config ${args.key} already exists; use update or deactivate first`);
    const id = await ctx.db.insert('configs', {
      key: args.key,
      value: args.value,
      version,
      isActive: true,
      createdAt: Date.now(),
    });
    return { configId: id, key: args.key, version, status: 'created' };
  },
});

export const update = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('configs')
      .withIndex('by_key_active', (q) => q.eq('key', args.key).eq('isActive', true))
      .first();
    if (!doc) throw new Error(`Config ${args.key} not found`);
    await ctx.db.patch(doc._id, {
      value: args.value,
      version: doc.version + 1,
    });
    return { configId: doc._id, key: args.key, version: doc.version + 1, status: 'updated' };
  },
});

export const deactivate = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('configs')
      .withIndex('by_key_active', (q) => q.eq('key', args.key).eq('isActive', true))
      .first();
    if (!doc) throw new Error(`Config ${args.key} not found`);
    await ctx.db.patch(doc._id, { isActive: false });
    return { configId: doc._id, key: args.key, status: 'deactivated' };
  },
});

/** Helper: get current active config value by key. Returns null if not found. */
export const getConfig = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('configs')
      .withIndex('by_key_active', (q) => q.eq('key', args.key).eq('isActive', true))
      .first();
    return doc?.value ?? null;
  },
});
