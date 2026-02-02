import { v } from 'convex/values';
import { query } from './_generated/server';

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
