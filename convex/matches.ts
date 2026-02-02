import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Match Operations Tool Cluster (5 functions)
 * Agent-native design: Automatic matching + manual negotiation
 */

// Find matches for an intent
export const findForIntent = query({
  args: {
    intentId: v.id('intents'),
    minScore: v.optional(v.number()), // Default: 50
  },
  handler: async (ctx, args) => {
    const intent = await ctx.db.get(args.intentId);
    if (!intent) {
      throw new Error(`Intent ${args.intentId} not found`);
    }
    
    // Find existing matches
    const existingMatches = await ctx.db
      .query('matches')
      .filter((q) =>
        q.or(
          q.eq(q.field('needIntentId'), args.intentId),
          q.eq(q.field('offerIntentId'), args.intentId)
        )
      )
      .collect();
    
    // Phase 1: Simple skill-based matching
    // need<->offer (complementary), query<->query, collaboration<->collaboration (same-type)
    const matchType =
      intent.type === 'need'
        ? 'offer'
        : intent.type === 'offer'
        ? 'need'
        : intent.type; // query, collaboration: match same type
    let allIntents = await ctx.db
      .query('intents')
      .filter((q) =>
        q.and(
          q.eq(q.field('type'), matchType),
          q.eq(q.field('status'), 'open')
        )
      )
      .collect();
    allIntents = allIntents.filter((i) => i._id !== args.intentId);
    
    const minScore = args.minScore ?? 50;
    const potentialMatches = allIntents
      .map((complementary) => {
        // Calculate simple skill overlap score
        const sharedSkills = intent.skills.filter((s) =>
          complementary.skills.some((cs) => cs.toLowerCase() === s.toLowerCase())
        );
        const score = Math.min(
          100,
          (sharedSkills.length / Math.max(intent.skills.length, 1)) * 100
        );
        
        return {
          intent: complementary,
          score,
          sharedSkills,
        };
      })
      .filter((m) => m.score >= minScore)
      .sort((a, b) => b.score - a.score);
    
    return {
      intent,
      existingMatches: existingMatches.map((m) => ({
        matchId: m._id,
        status: m.status,
        score: m.score,
        createdAt: m.createdAt,
      })),
      potentialMatches: potentialMatches.slice(0, 10), // Top 10
    };
  },
});

// Accept a match
export const accept = mutation({
  args: {
    matchId: v.id('matches'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error(`Match ${args.matchId} not found`);
    }
    
    // Verify agent is part of this match
    if (match.needAgentId !== args.agentId && match.offerAgentId !== args.agentId) {
      throw new Error('Agent not authorized for this match');
    }
    
    await ctx.db.patch(args.matchId, {
      status: 'accepted',
      acceptedAt: Date.now(),
    });
    
    // Update intent statuses
    await ctx.db.patch(match.needIntentId, { status: 'matched' });
    await ctx.db.patch(match.offerIntentId, { status: 'matched' });
    
    return { matchId: args.matchId, status: 'accepted' };
  },
});

// Reject a match
export const reject = mutation({
  args: {
    matchId: v.id('matches'),
    agentId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error(`Match ${args.matchId} not found`);
    }
    
    // Verify agent is part of this match
    if (match.needAgentId !== args.agentId && match.offerAgentId !== args.agentId) {
      throw new Error('Agent not authorized for this match');
    }
    
    // Delete the match
    await ctx.db.delete(args.matchId);
    
    return {
      matchId: args.matchId,
      status: 'rejected',
      reason: args.reason,
    };
  },
});

// Negotiate terms
export const negotiate = mutation({
  args: {
    matchId: v.id('matches'),
    agentId: v.string(),
    proposedTerms: v.any(), // Flexible negotiation data
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error(`Match ${args.matchId} not found`);
    }
    
    // Verify agent is part of this match
    if (match.needAgentId !== args.agentId && match.offerAgentId !== args.agentId) {
      throw new Error('Agent not authorized for this match');
    }
    
    await ctx.db.patch(args.matchId, {
      status: 'negotiating',
      proposedTerms: args.proposedTerms,
    });
    
    return {
      matchId: args.matchId,
      status: 'negotiating',
      proposedTerms: args.proposedTerms,
    };
  },
});

// Finalize match (ready for transaction)
export const finalize = mutation({
  args: {
    matchId: v.id('matches'),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error(`Match ${args.matchId} not found`);
    }
    
    // Verify agent is part of this match
    if (match.needAgentId !== args.agentId && match.offerAgentId !== args.agentId) {
      throw new Error('Agent not authorized for this match');
    }
    
    // Must be accepted first
    if (match.status !== 'accepted' && match.status !== 'negotiating') {
      throw new Error('Match must be accepted before finalizing');
    }
    
    await ctx.db.patch(args.matchId, {
      status: 'finalized',
      finalizedAt: Date.now(),
    });
    
    // Update intent statuses
    await ctx.db.patch(match.needIntentId, { status: 'closed' });
    await ctx.db.patch(match.offerIntentId, { status: 'closed' });
    
    return {
      matchId: args.matchId,
      status: 'finalized',
      readyForTransaction: true,
    };
  },
});

// Create a match (called by matching algorithm)
export const create = mutation({
  args: {
    needIntentId: v.id('intents'),
    offerIntentId: v.id('intents'),
    score: v.number(),
    algorithm: v.string(),
  },
  handler: async (ctx, args) => {
    const needIntent = await ctx.db.get(args.needIntentId);
    const offerIntent = await ctx.db.get(args.offerIntentId);
    
    if (!needIntent || !offerIntent) {
      throw new Error('Intent not found');
    }
    
    // Check if match already exists
    const existing = await ctx.db
      .query('matches')
      .filter((q) =>
        q.and(
          q.eq(q.field('needIntentId'), args.needIntentId),
          q.eq(q.field('offerIntentId'), args.offerIntentId)
        )
      )
      .first();
    
    if (existing) {
      return { matchId: existing._id, status: 'already_exists' };
    }
    
    const matchId = await ctx.db.insert('matches', {
      needIntentId: args.needIntentId,
      offerIntentId: args.offerIntentId,
      score: args.score,
      algorithm: args.algorithm,
      status: 'proposed',
      needAgentId: needIntent.agentId,
      offerAgentId: offerIntent.agentId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    return { matchId, status: 'created', score: args.score };
  },
});
