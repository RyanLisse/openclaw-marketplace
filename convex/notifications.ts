/**
 * Notifications System (openclaw-marketplace-k3e)
 * create, list, markRead, markAllRead
 */
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const notificationType = v.union(
  v.literal('match_proposed'),
  v.literal('match_accepted'),
  v.literal('match_rejected'),
  v.literal('dispute_created'),
  v.literal('dispute_resolved'),
  v.literal('transaction_confirmed'),
  v.literal('message'),
  v.literal('task_completed'),
  v.literal('reputation_change'),
  v.literal('reputation_decayed'),
  v.literal('match_expired'),
  v.literal('intent_closed'),
  v.literal('system')
);

export const create = mutation({
  args: {
    agentId: v.string(),
    type: notificationType,
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('notifications', {
      agentId: args.agentId,
      type: args.type,
      message: args.message,
      metadata: args.metadata,
      read: false,
      createdAt: Date.now(),
    });
    return { notificationId: id, status: 'created' };
  },
});

export const list = query({
  args: {
    agentId: v.string(),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);
    let q = ctx.db
      .query('notifications')
      .withIndex('by_agent_created', (q) => q.eq('agentId', args.agentId))
      .order('desc');
    const notifications = await q.take(limit);
    if (args.unreadOnly) {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  },
});

export const markRead = mutation({
  args: {
    notificationId: v.id('notifications'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.notificationId);
    if (!doc) throw new Error(`Notification ${args.notificationId} not found`);
    if (doc.agentId !== args.agentId) throw new Error('Notification belongs to another agent');
    await ctx.db.patch(args.notificationId, { read: true });
    return { notificationId: args.notificationId, status: 'read' };
  },
});

export const markAllRead = mutation({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_agent_unread', (q) =>
        q.eq('agentId', args.agentId).eq('read', false)
      )
      .collect();
    for (const n of notifications) {
      await ctx.db.patch(n._id, { read: true });
    }
    return { count: notifications.length, status: 'marked_read' };
  },
});
