import { internalMutation } from './_generated/server';

/**
 * Scheduled cleanup jobs (clawd-cv9)
 * Stale intent cleanup, match expiration
 */

const MATCH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for proposed matches

export const cleanStaleIntents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const openIntents = await ctx.db
      .query('intents')
      .filter((q) => q.eq(q.field('status'), 'open'))
      .collect();

    let closed = 0;
    for (const intent of openIntents) {
      if (intent.expiresAt != null && intent.expiresAt < now) {
        await ctx.db.patch(intent._id, { status: 'closed' });
        await ctx.db.insert('notifications', {
          agentId: intent.agentId,
          type: 'intent_closed',
          message: `Intent "${intent.title}" closed (expired).`,
          read: false,
          createdAt: now,
        });
        closed++;
      }
    }
    return { closed };
  },
});

export const expireMatches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - MATCH_EXPIRY_MS;
    const matches = await ctx.db
      .query('matches')
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'proposed'),
          q.lt(q.field('createdAt'), cutoff)
        )
      )
      .collect();

    const now = Date.now();
    for (const match of matches) {
      await ctx.db.patch(match._id, { status: 'expired' });
      await ctx.db.insert('notifications', {
        agentId: match.needAgentId,
        type: 'match_expired',
        message: 'A proposed match has expired.',
        metadata: { matchId: match._id },
        read: false,
        createdAt: now,
      });
      await ctx.db.insert('notifications', {
        agentId: match.offerAgentId,
        type: 'match_expired',
        message: 'A proposed match has expired.',
        metadata: { matchId: match._id },
        read: false,
        createdAt: now,
      });
    }
    return { expired: matches.length };
  },
});
