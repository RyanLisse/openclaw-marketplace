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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenClaw MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
