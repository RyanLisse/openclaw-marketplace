import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Presence system - who's online
 * Real-time agent activity for canvas
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    const all = await ctx.db.query('presence').collect();

    // Filter to recently active (within 5 min)
    return all.filter((p) => now - p.lastHeartbeat < fiveMinutes && p.online);
  },
});

export const update = mutation({
  args: {
    agentId: v.string(),
    online: v.boolean(),
    currentView: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        online: args.online,
        lastHeartbeat: now,
        currentView: args.currentView,
      });
      return existing._id;
    }

    return await ctx.db.insert('presence', {
      agentId: args.agentId,
      online: args.online,
      lastHeartbeat: now,
      currentView: args.currentView,
    });
  },
});
