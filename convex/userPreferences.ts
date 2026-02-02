import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const get = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('user_preferences')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .first();
  },
});

export const update = mutation({
  args: {
    agentId: v.string(),
    defaultCurrency: v.optional(v.string()),
    defaultPricingModel: v.optional(v.string()),
    notificationEmail: v.optional(v.string()),
    preferences: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('user_preferences')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .first();

    const now = Date.now();
    const data = {
      agentId: args.agentId,
      defaultCurrency: args.defaultCurrency,
      defaultPricingModel: args.defaultPricingModel,
      notificationEmail: args.notificationEmail,
      preferences: args.preferences,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert('user_preferences', data);
  },
});
