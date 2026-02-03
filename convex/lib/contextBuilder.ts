/**
 * Context Builder (openclaw-marketplace-1df)
 * buildAgentContext(ctx, agentId, userPrompt) and helpers for prompt variable injection.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GenericQueryCtx } from 'convex/server';
import type { DataModel } from '../_generated/dataModel';

export type AgentContext = {
  agentName: string;
  agentSkills: string;
  openIntentsCount: string;
  recentEvents: string;
  toolsList: string;
  trustTier: string;
  [key: string]: string;
};

/** Trust tier from reputation score (0-100). */
export function getTrustTier(reputationScore: number): string {
  if (reputationScore >= 80) return 'high';
  if (reputationScore >= 50) return 'medium';
  return 'low';
}

/** Format tools for context (e.g. intent_create, match_propose, ...). */
export function generateToolsList(): string {
  return [
    'intent_create',
    'intent_list',
    'match_propose',
    'match_accept',
    'match_reject',
    'agent_register',
    'agent_update_profile',
    'transaction_list',
    'dispute_get_list',
  ].join(', ');
}

/** Format recent events (matches, disputes) for context. */
export function formatRecentEvents(events: { type: string; summary: string }[]): string {
  if (events.length === 0) return 'No recent events.';
  return events.map((e) => `[${e.type}] ${e.summary}`).join('\n');
}

/**
 * Build agent context for prompt interpolation. Queries agent, intents, matches, presence.
 */
export async function buildAgentContext(
  ctx: GenericQueryCtx<DataModel>,
  agentId: string,
  userPrompt?: string
): Promise<AgentContext> {
  const agent = await ctx.db
    .query('agents')
    .withIndex('by_agent_id', (q: any) => q.eq('agentId', agentId))
    .first();

  const openIntents = await ctx.db
    .query('intents')
    .withIndex('by_agent', (q: any) => q.eq('agentId', agentId))
    .filter((q: any) => q.eq(q.field('status'), 'open'))
    .collect();

  const presence = await ctx.db
    .query('presence')
    .withIndex('by_agent', (q: any) => q.eq('agentId', agentId))
    .first();

  const matches = await ctx.db
    .query('matches')
    .withIndex('by_agents', (q: any) => q.eq('needAgentId', agentId))
    .order('desc')
    .take(5);

  const events = matches.map((m: any) => ({
    type: 'match',
    summary: `Match ${m.status} (score ${m.score})`,
  }));

  return {
    agentName: agent?.name ?? agentId,
    agentSkills: agent?.skills?.join(', ') ?? '',
    openIntentsCount: String(openIntents.length),
    recentEvents: formatRecentEvents(events),
    toolsList: generateToolsList(),
    trustTier: getTrustTier(agent?.reputationScore ?? 50),
    ...(userPrompt && { userPrompt }),
  };
}
