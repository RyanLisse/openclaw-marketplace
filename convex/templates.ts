import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {
    agentId: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query('templates').order('desc');
    if (args.agentId) {
      q = q.filter((f) => f.eq(f.field('agentId'), args.agentId));
    }
    if (args.type) {
      q = q.filter((f) => f.eq(f.field('type'), args.type));
    }
    return await q.take(50);
  },
});

export const search = query({
  args: {
    query: v.string(),
    agentId: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) {
      const all = await ctx.db.query('templates').order('desc').take(20);
      return args.agentId ? all.filter((t) => t.agentId === args.agentId) : all;
    }
    const results = await ctx.db
      .query('templates')
      .withSearchIndex('search_templates', (q) => {
        const search = q.search('title', args.query);
        if (args.agentId && args.type) return search.eq('agentId', args.agentId).eq('type', args.type);
        if (args.agentId) return search.eq('agentId', args.agentId);
        if (args.type) return search.eq('type', args.type);
        return search;
      })
      .take(20);
    return results;
  },
});

export const create = mutation({
  args: {
    agentId: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    pricingModel: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('templates', {
      ...args,
      useCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const incrementUse = mutation({
  args: { id: v.id('templates') },
  handler: async (ctx, args) => {
    const t = await ctx.db.get(args.id);
    if (!t) throw new Error('Template not found');
    await ctx.db.patch(args.id, { useCount: t.useCount + 1 });
    return t.useCount + 1;
  },
});
