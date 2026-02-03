#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { parseAndValidate, buildIntentPreview } from '@openclaw/core';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api.js';

const server = new McpServer(
  { name: 'openclaw-marketplace', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

function getConvexClient(): ConvexHttpClient {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('CONVEX_URL or NEXT_PUBLIC_CONVEX_URL required');
  return new ConvexHttpClient(url);
}

server.registerTool(
  'intent_parse',
  {
    description: 'Parse natural language into an intent draft',
    inputSchema: z.object({ text: z.string().describe('Natural language intent') }),
  },
  async ({ text }: { text: string }) => {
    const { draft, validation } = parseAndValidate(text);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ draft, validation }, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  'intent_preview',
  {
    description: 'Build intent preview from draft or natural language',
    inputSchema: z.object({
      text: z.string().optional(),
      draft: z.record(z.unknown()).optional(),
    }),
  },
  async ({ text, draft: draftArg }: { text?: string; draft?: Record<string, unknown> }) => {
    let draft: Record<string, unknown>;
    if (text) {
      const { draft: d } = parseAndValidate(text);
      draft = d as Record<string, unknown>;
    } else if (draftArg) {
      draft = draftArg;
    } else {
      return { content: [{ type: 'text' as const, text: 'Provide text or draft' }] };
    }
    const preview = buildIntentPreview(draft as any);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(preview, null, 2) }],
    };
  }
);

server.registerTool(
  'intent_list',
  {
    description: 'List intents from Convex',
    inputSchema: z.object({
      type: z.string().optional(),
      status: z.string().optional(),
    }),
  },
  async (args: { type?: string; status?: string }) => {
    try {
      const client = getConvexClient();
      const intents = await client.query(api.intents.list, args);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(intents, null, 2) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${err instanceof Error ? err.message : err}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  'intent_search_templates',
  {
    description: 'Search intent templates',
    inputSchema: z.object({
      query: z.string(),
      agentId: z.string().optional(),
      type: z.string().optional(),
    }),
  },
  async (args: { query: string; agentId?: string; type?: string }) => {
    try {
      const client = getConvexClient();
      const templates = await client.query(api.templates.search, args);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(templates, null, 2) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${err instanceof Error ? err.message : err}`,
          },
        ],
      };
    }
  }
);

server.registerTool(
  'intent_get_context',
  {
    description: 'Get marketplace context (active intents count, presence)',
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const client = getConvexClient();
      const [intents, presence] = await Promise.all([
        client.query(api.intents.list, { status: 'open' }),
        client.query(api.presence.list),
      ]);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { openIntents: intents.length, onlineAgents: presence.filter((p: any) => p.online).length },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${err instanceof Error ? err.message : err}`,
          },
        ],
      };
    }
  }
);

// Week 1 MCP Tools - Action Parity & CRUD Completeness

server.registerTool(
  'intent_create',
  {
    description: 'Create a new intent (need or offer) in the marketplace',
    inputSchema: z.object({
      type: z.enum(['need', 'offer']).describe('Intent type: need or offer'),
      agentId: z.string().describe('Agent ID creating the intent'),
      title: z.string().describe('Intent title'),
      description: z.string().describe('Detailed description'),
      skills: z.array(z.string()).describe('Required/offered skills'),
      pricingModel: z.enum(['fixed', 'hourly', 'subscription', 'negotiable']).optional().describe('Pricing model'),
      amount: z.number().optional().describe('Price amount'),
      currency: z.string().optional().describe('Currency code (e.g., USDC)'),
      minReputation: z.number().optional().describe('Minimum reputation required'),
      maxResponseTime: z.number().optional().describe('Max response time in hours'),
      metadata: z.record(z.unknown()).optional().describe('Additional metadata'),
    }),
  },
  async (args: {
    type: 'need' | 'offer';
    agentId: string;
    title: string;
    description: string;
    skills: string[];
    pricingModel?: 'fixed' | 'hourly' | 'subscription' | 'negotiable';
    amount?: number;
    currency?: string;
    minReputation?: number;
    maxResponseTime?: number;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const client = getConvexClient();
      const result = await client.mutation(api.intents.create, args);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ success: true, data: result }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.registerTool(
  'match_propose',
  {
    description: 'Propose a match between a need intent and an offer intent',
    inputSchema: z.object({
      needIntentId: z.string().describe('Need intent ID'),
      offerIntentId: z.string().describe('Offer intent ID'),
      score: z.number().min(0).max(100).describe('Match score (0-100)'),
      algorithm: z.string().describe('Algorithm used for matching (e.g., skill-overlap, embedding-similarity)'),
    }),
  },
  async (args: {
    needIntentId: string;
    offerIntentId: string;
    score: number;
    algorithm: string;
  }) => {
    try {
      const client = getConvexClient();
      const result = await client.mutation(api.matches.create, args as any);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ success: true, data: result }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.registerTool(
  'match_accept',
  {
    description: 'Accept a proposed match',
    inputSchema: z.object({
      matchId: z.string().describe('Match ID to accept'),
      agentId: z.string().describe('Agent ID accepting the match'),
    }),
  },
  async (args: { matchId: string; agentId: string }) => {
    try {
      const client = getConvexClient();
      const result = await client.mutation(api.matches.accept, args as any);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ success: true, data: result }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.registerTool(
  'match_reject',
  {
    description: 'Reject a proposed match',
    inputSchema: z.object({
      matchId: z.string().describe('Match ID to reject'),
      agentId: z.string().describe('Agent ID rejecting the match'),
      reason: z.string().optional().describe('Optional reason for rejection'),
    }),
  },
  async (args: { matchId: string; agentId: string; reason?: string }) => {
    try {
      const client = getConvexClient();
      const result = await client.mutation(api.matches.reject, args as any);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ success: true, data: result }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.registerTool(
  'agent_register',
  {
    description: 'Register a new agent in the marketplace',
    inputSchema: z.object({
      agentId: z.string().describe('Unique agent identifier'),
      name: z.string().describe('Agent name'),
      bio: z.string().optional().describe('Agent biography/description'),
      skills: z.array(z.string()).describe('Agent skills'),
      intentTypes: z.array(z.string()).describe('Intent types agent can handle (need, offer, query, etc.)'),
      metadata: z.record(z.unknown()).optional().describe('Additional metadata'),
    }),
  },
  async (args: {
    agentId: string;
    name: string;
    bio?: string;
    skills: string[];
    intentTypes: string[];
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const client = getConvexClient();
      const result = await client.mutation(api.agents.register, args);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ success: true, data: result }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.registerTool(
  'agent_update_profile',
  {
    description: 'Update agent profile information',
    inputSchema: z.object({
      agentId: z.string().describe('Agent identifier'),
      updates: z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        skills: z.array(z.string()).optional(),
        intentTypes: z.array(z.string()).optional(),
        metadata: z.record(z.unknown()).optional(),
      }).describe('Profile fields to update'),
    }),
  },
  async (args: {
    agentId: string;
    updates: {
      name?: string;
      bio?: string;
      skills?: string[];
      intentTypes?: string[];
      metadata?: Record<string, unknown>;
    };
  }) => {
    try {
      const client = getConvexClient();
      const result = await client.mutation(api.agents.updateProfile, args);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ success: true, data: result }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.registerTool(
  'dispute_get_list',
  {
    description: 'Get or list disputes (requires implementing get/list queries first)',
    inputSchema: z.object({
      disputeId: z.string().optional().describe('Specific dispute ID to get'),
      status: z.string().optional().describe('Filter by status (open, voting, resolved)'),
    }),
  },
  async (args: { disputeId?: string; status?: string }) => {
    try {
      const client = getConvexClient();
      // Note: This requires api.disputes.get and api.disputes.list to be implemented
      if (args.disputeId) {
        const result = await client.query(api.disputes.get as any, { id: args.disputeId });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ success: true, data: result }, null, 2),
            },
          ],
        };
      } else {
        const result = await client.query(api.disputes.list as any, { status: args.status });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ success: true, data: result }, null, 2),
            },
          ],
        };
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

server.registerTool(
  'transaction_list',
  {
    description: 'List transactions with optional status filter',
    inputSchema: z.object({
      status: z.string().optional().describe('Filter by status (pending, completed, failed)'),
    }),
  },
  async (args: { status?: string }) => {
    try {
      const client = getConvexClient();
      const result = await client.query(api.transactions.list, args);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ success: true, data: result }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: err instanceof Error ? err.message : String(err),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenClaw MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
