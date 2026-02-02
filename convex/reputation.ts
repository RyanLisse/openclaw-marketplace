import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';

const TRUST_TIERS = [
  { min: 0, max: 1.5, label: 'New' },
  { min: 1.5, max: 3.0, label: 'Verified' },
  { min: 3.0, max: 4.0, label: 'Trusted' },
  { min: 4.0, max: 5.1, label: 'Elite' },
];

const WEIGHTS = { quality: 0.4, reliability: 0.3, communication: 0.15, fairness: 0.15 };
const DECAY_FACTOR = 0.95; // per month

function getTier(score: number): string {
  for (const t of TRUST_TIERS) {
    if (score >= t.min && score < t.max) return t.label;
  }
  return 'New';
}

function weightedScore(c: { quality: number; reliability: number; communication: number; fairness: number }): number {
  return (
    c.quality * WEIGHTS.quality +
    c.reliability * WEIGHTS.reliability +
    c.communication * WEIGHTS.communication +
    c.fairness * WEIGHTS.fairness
  );
}

export const get = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();

    if (!agent) return null;

    const events = await ctx.db
      .query('reputationEvents')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .order('desc')
      .take(50);

    const q = agent.quality ?? 50;
    const r = agent.reliability ?? 50;
    const comm = agent.communication ?? 50;
    const f = agent.fairness ?? 50;
    const components = { quality: q, reliability: r, communication: comm, fairness: f };
    const score = Math.min(5, Math.max(0, weightedScore(components) / 20));
    const tier = getTier(score);

    return {
      agentId: args.agentId,
      score: Number(score.toFixed(2)),
      completedTasks: agent.completedTasks,
      tier,
      components: {
        quality: Number((q / 20).toFixed(2)),
        reliability: Number((r / 20).toFixed(2)),
        communication: Number((comm / 20).toFixed(2)),
        fairness: Number((f / 20).toFixed(2)),
      },
      recentEvents: events,
    };
  },
});

export const recordRating = mutation({
  args: {
    agentId: v.string(),
    rating: v.number(),
    component: v.optional(v.string()), // quality | reliability | communication | fairness
    matchId: v.optional(v.id('matches')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();

    if (!agent) throw new Error('Agent not found');

    const impact = (args.rating - 2.5) * 10; // 0-100 scale
    const comp = args.component && ['quality', 'reliability', 'communication', 'fairness'].includes(args.component)
      ? args.component
      : 'quality';

    const current = (agent as any)[comp] ?? 50;
    const newVal = Math.min(100, Math.max(0, current + impact));

    await ctx.db.insert('reputationEvents', {
      agentId: args.agentId,
      type: 'rating',
      impact,
      component: comp,
      matchId: args.matchId,
      reason: args.reason ?? `Rating: ${args.rating}/5 (${comp})`,
      createdAt: Date.now(),
    });

    const components = {
      quality: comp === 'quality' ? newVal : (agent.quality ?? 50),
      reliability: comp === 'reliability' ? newVal : (agent.reliability ?? 50),
      communication: comp === 'communication' ? newVal : (agent.communication ?? 50),
      fairness: comp === 'fairness' ? newVal : (agent.fairness ?? 50),
    };

    await ctx.db.patch(agent._id, {
      completedTasks: agent.completedTasks + 1,
      [comp]: newVal,
      reputationScore: weightedScore(components),
    });

    return { agentId: args.agentId, component: comp, newValue: newVal, rating: args.rating };
  },
});

export const applyDecay = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();
    if (!agent) return null;

    const now = Date.now();
    const lastDecay = agent.lastDecayAt ?? agent.lastSeen;
    const months = Math.floor((now - lastDecay) / (30 * 24 * 60 * 60 * 1000));
    if (months < 1) return { agentId: args.agentId, decayed: false };

    const decay = Math.pow(DECAY_FACTOR, months);
    const q = Math.max(0, ((agent.quality ?? 50) - 50) * decay + 50);
    const r = Math.max(0, ((agent.reliability ?? 50) - 50) * decay + 50);
    const c = Math.max(0, ((agent.communication ?? 50) - 50) * decay + 50);
    const f = Math.max(0, ((agent.fairness ?? 50) - 50) * decay + 50);

    await ctx.db.insert('reputationEvents', {
      agentId: args.agentId,
      type: 'decay',
      impact: -1,
      reason: `Monthly decay (${months} months)`,
      createdAt: now,
    });

    await ctx.db.patch(agent._id, {
      quality: q,
      reliability: r,
      communication: c,
      fairness: f,
      reputationScore: weightedScore({ quality: q, reliability: r, communication: c, fairness: f }),
      lastDecayAt: now,
    });

    return { agentId: args.agentId, decayed: true, months };
  },
});

export const runDecayForAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query('agents').collect();
    let decayed = 0;
    for (const agent of agents) {
      const now = Date.now();
      const lastDecay = agent.lastDecayAt ?? agent.lastSeen;
      const months = Math.floor((now - lastDecay) / (30 * 24 * 60 * 60 * 1000));
      if (months < 1) continue;

      const decay = Math.pow(DECAY_FACTOR, months);
      const q = Math.max(0, ((agent.quality ?? 50) - 50) * decay + 50);
      const r = Math.max(0, ((agent.reliability ?? 50) - 50) * decay + 50);
      const c = Math.max(0, ((agent.communication ?? 50) - 50) * decay + 50);
      const f = Math.max(0, ((agent.fairness ?? 50) - 50) * decay + 50);

      await ctx.db.patch(agent._id, {
        quality: q,
        reliability: r,
        communication: c,
        fairness: f,
        reputationScore: weightedScore({ quality: q, reliability: r, communication: c, fairness: f }),
        lastDecayAt: now,
      });
      decayed++;
    }
    return { decayed, total: agents.length };
  },
});
