import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Votes CRUD Operations
 * Manages community votes on disputes
 */

export const get = query({
  args: {
    id: v.id('votes'),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db.get(args.id);
    if (!vote) throw new Error(`Vote ${args.id} not found`);
    return vote;
  },
});

export const list = query({
  args: {
    disputeId: v.optional(v.id('disputes')),
    agentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query('votes').order('desc');
    
    let votes = await q.take(100);
    
    if (args.disputeId) {
      votes = votes.filter((v) => v.disputeId === args.disputeId);
    }
    if (args.agentId) {
      votes = votes.filter((v) => v.agentId === args.agentId);
    }
    
    return votes;
  },
});

export const update = mutation({
  args: {
    voteId: v.id('votes'),
    vote: v.string(), // 'uphold' | 'refund'
    justification: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingVote = await ctx.db.get(args.voteId);
    if (!existingVote) throw new Error(`Vote ${args.voteId} not found`);

    // Check if dispute is still in voting status
    const dispute = await ctx.db.get(existingVote.disputeId);
    if (!dispute || dispute.status !== 'voting') {
      throw new Error('Dispute is not in voting status');
    }

    await ctx.db.patch(args.voteId, {
      vote: args.vote,
      ...(args.justification && { justification: args.justification }),
      updatedAt: Date.now(),
    });

    return { voteId: args.voteId, status: 'updated' };
  },
});

export const retract = mutation({
  args: {
    voteId: v.id('votes'),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db.get(args.voteId);
    if (!vote) throw new Error(`Vote ${args.voteId} not found`);

    // Check if dispute is still in voting status
    const dispute = await ctx.db.get(vote.disputeId);
    if (!dispute || dispute.status !== 'voting') {
      throw new Error('Dispute is not in voting status - cannot retract vote');
    }

    await ctx.db.delete(args.voteId);
    return { voteId: args.voteId, status: 'retracted' };
  },
});
