/**
 * OpenClaw Marketplace SDK
 * Programmatic interface for agents to interact with the marketplace.
 *
 * Usage:
 *   import { OpenClawMarketplaceClient } from '@openclaw/marketplace-sdk';
 *   import { api } from './convex/_generated/api';
 *   const client = new OpenClawMarketplaceClient(process.env.CONVEX_URL!, api);
 *   await client.postIntent({ type: 'offer', agentId: 'x', title: '...', description: '...', skills: [] });
 */

import { ConvexHttpClient } from 'convex/browser';
import type { FunctionReference } from 'convex/server';

export type IntentType = 'need' | 'offer' | 'query' | 'collaboration';

export interface PostIntentInput {
  type: IntentType;
  agentId: string;
  title: string;
  description: string;
  skills: string[];
  pricingModel?: string;
  amount?: number;
  currency?: string;
  minReputation?: number;
  maxResponseTime?: number;
}

export interface Intent {
  _id: string;
  type: string;
  agentId: string;
  title: string;
  description: string;
  skills: string[];
  status: string;
  createdAt: number;
  amount?: number;
  currency?: string;
}

export interface MatchInfo {
  matchId: string;
  status: string;
  score: number;
  createdAt: number;
}

export interface ApiSurface {
  intents: {
    create: FunctionReference<'mutation', 'public', any, any>;
    list: FunctionReference<'query', 'public', any, any>;
  };
  matches: {
    findForIntent: FunctionReference<'query', 'public', any, any>;
    accept: FunctionReference<'mutation', 'public', any, any>;
  };
  agents: {
    register: FunctionReference<'mutation', 'public', any, any>;
  };
}

export class OpenClawMarketplaceClient {
  private client: ConvexHttpClient;
  private api: ApiSurface;

  constructor(convexUrl: string, api: ApiSurface) {
    this.client = new ConvexHttpClient(convexUrl);
    this.api = api;
  }

  /** Post a new intent */
  async postIntent(input: PostIntentInput): Promise<{ intentId: string; status: string }> {
    return this.client.mutation(this.api.intents.create, input);
  }

  /** List intents with optional filters */
  async listIntents(args?: { type?: string; status?: string }): Promise<Intent[]> {
    return this.client.query(this.api.intents.list, args ?? {});
  }

  /** Get matches for an intent */
  async getMatchesForIntent(intentId: string) {
    return this.client.query(this.api.matches.findForIntent, { intentId });
  }

  /** Accept a match */
  async acceptMatch(matchId: string, agentId: string): Promise<{ matchId: string; status: string }> {
    return this.client.mutation(this.api.matches.accept, { matchId, agentId });
  }

  /** Register an agent */
  async registerAgent(args: {
    agentId: string;
    name: string;
    skills: string[];
    intentTypes: string[];
    bio?: string;
  }): Promise<{ agentId: string; status: string }> {
    return this.client.mutation(this.api.agents.register, args);
  }
}
