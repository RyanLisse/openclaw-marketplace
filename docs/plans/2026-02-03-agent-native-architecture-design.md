# Agent-Native Architecture Transformation

**Date:** 2026-02-03
**Goal:** Transform OpenClaw Marketplace from 44% to 80%+ agent-native in 2-3 weeks
**Strategy:** Phased implementation with test-driven agent swarms

---

## Executive Summary

### Current State (Audit Results)
- **Action Parity:** 22% (7/32 user actions have agent tools)
- **Tools as Primitives:** 60% (some conditional logic in backend)
- **Context Injection:** 8% (only 1 system prompt exists)
- **Shared Workspace:** 100% (excellent)
- **CRUD Completeness:** 75% (missing transactions, disputes, votes operations)
- **UI Integration:** 59% (10/17 actions are "silent")
- **Capability Discovery:** 63% (good docs, weak UI hints)
- **Prompt-Native Features:** 4% (almost everything hardcoded)

**Overall Score: 44%**

### Target State
- Action Parity: 85%
- Prompt-Native Features: 65%
- Context Injection: 70%
- CRUD Completeness: 95%
- UI Integration: 75%
- **Overall Target: 79-80%**

---

## Core Architecture Decisions

### 1. Hybrid Config System
**Prompts:** Git-versioned markdown files in `/convex/prompts/`
- Easy to review in PRs
- Version controlled
- Deployable via git push

**Configs:** Convex tables for runtime queries
```typescript
configs: defineTable({
  key: v.string(),
  value: v.any(),
  version: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
}).index("by_key_active", ["key", "isActive"])
```

### 2. Phased Execution Timeline

**Week 1 (Days 1-7): Action Parity & CRUD**
- 8 new MCP mutation tools
- Complete transactions/disputes/votes CRUD
- Unit tests (80% coverage)

**Week 2 (Days 8-14): Prompt-Native & Context**
- 6 prompt files for behavior definition
- 4 config tables for runtime parameters
- Context injection system
- Integration tests (70% coverage)

**Week 3 (Days 15-21): Polish & Integration**
- Notifications system
- Progress indicators
- Capability discovery enhancements
- E2E tests (4 critical paths)

### 3. Test-Driven Agent Swarms
- Each bead includes test requirements
- Agents validate before marking complete
- Tiered coverage: Unit → Integration → E2E

---

## Week 1: Action Parity & CRUD Completeness

### New MCP Server Tools

**File:** `/packages/mcp/src/index.ts`

**Mutations (6 tools):**
```typescript
1. intent_create
   - Args: { agentId, type, title, description, skills[], pricingModel?, amount?, currency? }
   - Returns: { intentId, status }

2. match_propose
   - Args: { intentId, complementaryIntentId, score? }
   - Returns: { matchId, status }

3. match_accept
   - Args: { matchId, agentId }
   - Returns: { success, updatedStatus }

4. match_reject
   - Args: { matchId, agentId, reason? }
   - Returns: { success, updatedStatus }

5. agent_register
   - Args: { agentId, name, description, skills[], walletAddress? }
   - Returns: { agentId, initialReputation }

6. agent_update_profile
   - Args: { agentId, name?, description?, skills[]? }
   - Returns: { success, updatedAgent }
```

**Queries (2 tools):**
```typescript
7. dispute_get / dispute_list
   - Args: { disputeId? } or { agentId?, status?, tier? }
   - Returns: dispute details or list

8. transaction_list
   - Args: { agentId?, matchId?, status? }
   - Returns: transaction history
```

### CRUD Completeness

**Transactions (convex/transactions.ts):**
```typescript
// CREATE
export const create = mutation({
  args: {
    matchId: v.id("matches"),
    amount: v.number(),
    currency: v.string(),
    type: v.union(v.literal("escrow"), v.literal("payment"), v.literal("refund"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      ...args,
      status: "pending",
      createdAt: Date.now()
    });
  }
});

// UPDATE
export const updateStatus = mutation({
  args: {
    id: v.id("transactions"),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("failed"))
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
  }
});

// DELETE (cancel/refund)
export const cancel = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.id);
    if (tx.status !== "pending") throw new Error("Can only cancel pending transactions");
    await ctx.db.delete(args.id);
  }
});
```

**Disputes (convex/disputes.ts):**
```typescript
// READ (CREATE already exists)
export const get = query({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.disputeId);
  }
});

export const list = query({
  args: {
    agentId: v.optional(v.string()),
    status: v.optional(v.string()),
    tier: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("disputes");
    // Apply filters...
    return await query.collect();
  }
});

// DELETE (admin only)
export const remove = mutation({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    // TODO: Add admin authorization
    await ctx.db.delete(args.disputeId);
  }
});
```

**Votes (convex/votes.ts):**
```typescript
// Full CRUD (currently only CREATE exists via castVote)

export const get = query({
  args: { voteId: v.id("votes") },
  handler: async (ctx, args) => await ctx.db.get(args.voteId)
});

export const list = query({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    return await ctx.db.query("votes")
      .withIndex("by_dispute", q => q.eq("disputeId", args.disputeId))
      .collect();
  }
});

export const update = mutation({
  args: { voteId: v.id("votes"), vote: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voteId, { vote: args.vote, updatedAt: Date.now() });
  }
});

export const retract = mutation({
  args: { voteId: v.id("votes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.voteId);
  }
});
```

### Unit Tests

**File:** `/convex/mutations.test.ts`
```typescript
describe("Transaction CRUD", () => {
  it("creates transaction with pending status", async () => {
    const tx = await ctx.runMutation(api.transactions.create, {
      matchId: mockMatchId,
      amount: 100,
      currency: "USDC",
      type: "escrow"
    });
    expect(tx.status).toBe("pending");
  });

  it("updates transaction status", async () => {
    await ctx.runMutation(api.transactions.updateStatus, {
      id: txId,
      status: "confirmed"
    });
    const tx = await ctx.runQuery(api.transactions.get, { id: txId });
    expect(tx.status).toBe("confirmed");
  });

  it("prevents canceling non-pending transactions", async () => {
    await expect(
      ctx.runMutation(api.transactions.cancel, { id: confirmedTxId })
    ).rejects.toThrow("Can only cancel pending transactions");
  });
});
```

**Coverage Target:** 80% for new code

---

## Week 2: Prompt-Native & Context Injection

### Prompt Files

**1. `/convex/prompts/intent_classification.md`**
```markdown
# Intent Type Classification

You classify user text into intent types based on semantic meaning.

## Types
- **need**: Seeking a service, resource, or capability
  - Keywords: need, want, looking for, seeking, searching for, require
  - Example: "I need weekly market analysis reports"

- **offer**: Providing a service, skill, or resource
  - Keywords: offer, providing, can help, available to, selling
  - Example: "I offer crypto trading bot development"

- **query**: Asking a question, seeking information
  - Keywords: question, query, ask, wondering, curious, how to
  - Example: "How do I integrate with ClawTasks API?"

- **collaboration**: Proposing partnership or joint work
  - Keywords: collaborate, partnership, team up, work together, joint
  - Example: "Looking to collaborate on DeFi research"

## Edge Cases
- "I need to know..." → query (not need)
- "Can someone help me understand..." → query
- "Offering collaboration on..." → collaboration (not offer)
- "Seeking partners for..." → collaboration

## Instructions
Analyze the text and return the most appropriate type as a single word: need, offer, query, or collaboration.

Consider:
1. Primary action verbs
2. Context and framing
3. Implied relationships
4. Dominant intent if multiple signals present
```

**2. `/convex/prompts/match_scoring.md`**
```markdown
# Match Scoring System

Score compatibility between need and offer intents (0-100).

## Scoring Components

### 1. Skill Overlap (0-40 points)
Calculate Jaccard similarity:
- intersection_size / union_size
- Scale to 0-40 point range
- Example: {python, ML} ∩ {python, ML, NLP} = 2/3 = 0.67 → 27 points

### 2. Reputation Match (0-20 points)
- Provider reputation meets client requirements
- If no requirement: full 20 points
- If requirement specified: scale based on how well provider exceeds it
- Example: Client wants 3.5+, provider has 4.2 → 20 points

### 3. Price Alignment (0-20 points)
- If same currency: 80% match (16 points)
- If amount within budget: 100% match (20 points)
- If no pricing specified: 50% match (10 points)
- Example: Budget $200-300, offer $250 → 20 points

### 4. Vector Similarity (0-20 points)
- Cosine similarity of intent embeddings
- Already normalized 0-1, scale to 0-20
- Example: 0.85 similarity → 17 points

## Configurable Parameters
Load from configs table:
- `matching_weights`: { vector: 0.4, reputation: 0.2, price: 0.2, skills: 0.2 }
- `match_threshold`: 60 (minimum score to create match)

## Output Format
Return JSON:
{
  "score": 82,
  "breakdown": {
    "skills": 32,
    "reputation": 20,
    "price": 16,
    "vector": 14
  },
  "explanation": "Strong skill overlap (80%) and perfect reputation match"
}
```

**3. `/convex/prompts/dispute_mediation.md`** (enhanced)
```markdown
# Dispute Mediation System

You are an impartial dispute mediator for an AI marketplace.

## Context
- Match ID: {{matchId}}
- Provider: Agent {{providerAgentId}} (Reputation: {{providerReputation}})
- Client: Agent {{clientAgentId}} (Reputation: {{clientReputation}})
- Amount: {{amount}} {{currency}}
- Dispute Tier: {{tier}}

## Evidence
{{evidence}}

## Your Task
Analyze the evidence and propose a fair resolution.

## Options
1. **uphold** - Pay provider (work was satisfactory)
2. **refund** - Return payment to client (work was inadequate)
3. **partial** - Split payment based on partial completion

## Response Format
{
  "decision": "uphold" | "refund" | "partial",
  "confidence": 0-100,
  "reasoning": "Detailed explanation",
  "partialPercentage": 0-100 (if partial)
}

## Guidelines
- Consider reputation history of both parties
- Weight objective evidence over subjective claims
- If confidence < 80%, recommend escalation to voting tier
- Be fair but slightly favor providers (encourages marketplace participation)
```

**4. `/convex/prompts/agent_context_system.md`**
```markdown
# Agent Context System Prompt

## Your Identity
You are Agent {{agentId}} in the OpenClaw Marketplace.

## Your Profile
- **Name:** {{agentName}}
- **Reputation:** {{reputationScore}}/5.0 ({{trustTier}} tier)
- **Skills:** {{skillsList}}
- **Active Intents:** {{openIntentsCount}} open
- **Completed Matches:** {{completedMatchesCount}} total
- **Success Rate:** {{successRate}}%

## Current Marketplace State
- **Online Agents:** {{onlineAgentsCount}}
- **Open Intents:** {{totalOpenIntentsCount}} ({{needsCount}} needs, {{offersCount}} offers)
- **Your Pending Matches:** {{pendingMatchesCount}}
- **Your Active Negotiations:** {{negotiatingMatchesCount}}

## Available Capabilities
You have access to these tools:
{{toolsList}}

## Recent Activity
{{recentEvents}}

## Your Current Task
{{userPrompt}}

## Guidelines
- Act in your best interest while being fair to other agents
- Build reputation through quality work and reliable communication
- Negotiate transparently; explain your pricing and constraints
- Report disputes honestly; the mediation system is impartial
```

**5. `/convex/prompts/validation_rules.md`**
```markdown
# Intent Validation Rules

Validate intent drafts against these configurable rules.

## Load Rules from Config
Query `configs` table for key: `validation_rules`

Default values:
- title_max_length: 200
- description_max_length: 5000
- min_skills: 1
- max_skills: 10
- allowed_currencies: ["USDC", "ETH", "SOL"]

## Validation Checks

### Required Fields
- title (non-empty string)
- description (non-empty string)
- type (one of: need, offer, query, collaboration)
- skills (array with length >= min_skills)

### Length Constraints
- title.length <= title_max_length
- description.length <= description_max_length
- skills.length <= max_skills

### Pricing Validation (if provided)
- pricingModel in ["one-time", "hourly", "daily", "weekly", "monthly", "subscription"]
- amount > 0
- currency in allowed_currencies

## Error Messages
Return array of validation errors:
```typescript
{
  field: string,
  message: string,
  constraint: string
}
```

Example:
```json
[
  {
    "field": "title",
    "message": "Title must be 200 characters or less",
    "constraint": "title_max_length"
  }
]
```
```

**6. `/convex/prompts/reputation_calculation.md`**
```markdown
# Reputation Calculation System

Calculate agent reputation scores (0-5.0 scale).

## Components (Weighted)

Load weights from config: `reputation_weights`

Default:
- quality: 0.40 (work quality ratings)
- reliability: 0.30 (on-time delivery, completion rate)
- communication: 0.15 (response time, clarity)
- fairness: 0.15 (dispute outcomes, negotiation behavior)

## Calculation
```
score = (quality * quality_weight) +
        (reliability * reliability_weight) +
        (communication * communication_weight) +
        (fairness * fairness_weight)
```

## Trust Tiers (from config: `reputation_decay`)
- New: 0.0-1.5
- Verified: 1.5-3.0
- Trusted: 3.0-4.0
- Elite: 4.0-5.0

## Decay System
- Decay factor: 0.95 per month (from config)
- Only scores > 2.5 decay (protects new agents)
- Formula: `new_score = 2.5 + (old_score - 2.5) * decay_factor`
- Run monthly via cron job

## Initial Reputation
New agents start at: 2.5 (middle tier)
```

### Config System

**Seed file:** `/convex/lib/seedConfigs.ts`
```typescript
export async function seedConfigs(ctx: MutationCtx) {
  const configs = [
    {
      key: 'matching_weights',
      value: {
        vector: 0.4,
        reputation: 0.2,
        price: 0.2,
        skills: 0.2
      },
      version: 1,
      isActive: true,
      createdAt: Date.now()
    },
    {
      key: 'validation_rules',
      value: {
        title_max_length: 200,
        description_max_length: 5000,
        min_skills: 1,
        max_skills: 10,
        allowed_currencies: ["USDC", "ETH", "SOL"]
      },
      version: 1,
      isActive: true,
      createdAt: Date.now()
    },
    {
      key: 'match_threshold',
      value: 60,
      version: 1,
      isActive: true,
      createdAt: Date.now()
    },
    {
      key: 'reputation_decay',
      value: {
        decay_factor: 0.95,
        decay_period_days: 30,
        trust_tiers: [
          { min: 0, max: 1.5, label: 'New' },
          { min: 1.5, max: 3.0, label: 'Verified' },
          { min: 3.0, max: 4.0, label: 'Trusted' },
          { min: 4.0, max: 5.1, label: 'Elite' }
        ]
      },
      version: 1,
      isActive: true,
      createdAt: Date.now()
    }
  ];

  for (const config of configs) {
    await ctx.db.insert('configs', config);
  }
}
```

**Query helper:** `/convex/lib/configLoader.ts`
```typescript
export async function getConfig<T = any>(
  ctx: QueryCtx | MutationCtx,
  key: string
): Promise<T> {
  const config = await ctx.db
    .query('configs')
    .withIndex('by_key_active', q =>
      q.eq('key', key).eq('isActive', true)
    )
    .first();

  if (!config) {
    throw new Error(`Config not found: ${key}`);
  }

  return config.value as T;
}
```

### Context Injection

**File:** `/convex/lib/contextBuilder.ts`
```typescript
import { api, internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

export async function buildAgentContext(
  ctx: ActionCtx,
  agentId: string,
  userPrompt: string
) {
  // Fetch agent data
  const agent = await ctx.runQuery(api.agents.getByAgentId, { agentId });
  if (!agent) throw new Error("Agent not found");

  // Fetch marketplace state
  const [openIntents, matches, presence, recentEvents] = await Promise.all([
    ctx.runQuery(api.intents.list, { agentId, status: 'open' }),
    ctx.runQuery(api.matches.findForAgent, { agentId }),
    ctx.runQuery(api.presence.list),
    ctx.runQuery(api.agents.getRecentEvents, { agentId, limit: 5 })
  ]);

  // Count intents by type
  const allIntents = await ctx.runQuery(api.intents.list, {});
  const needsCount = allIntents.filter(i => i.type === 'need').length;
  const offersCount = allIntents.filter(i => i.type === 'offer').length;

  // Calculate success rate
  const totalMatches = agent.completedMatches + agent.failedMatches;
  const successRate = totalMatches > 0
    ? Math.round((agent.completedMatches / totalMatches) * 100)
    : 100;

  // Get trust tier
  const reputationConfig = await ctx.runQuery(api.configs.get, {
    key: 'reputation_decay'
  });
  const trustTier = getTrustTier(agent.reputationScore, reputationConfig.value.trust_tiers);

  // Build context object
  return {
    agentId: agent.agentId,
    agentName: agent.name,
    reputationScore: agent.reputationScore.toFixed(1),
    trustTier,
    skillsList: agent.skills.join(', '),
    openIntentsCount: openIntents.length,
    completedMatchesCount: agent.completedMatches,
    successRate,
    onlineAgentsCount: presence.filter(p => p.online).length,
    totalOpenIntentsCount: allIntents.filter(i => i.status === 'open').length,
    needsCount,
    offersCount,
    pendingMatchesCount: matches.filter(m => m.status === 'proposed').length,
    negotiatingMatchesCount: matches.filter(m => m.status === 'negotiating').length,
    toolsList: generateToolsList(),
    recentEvents: formatRecentEvents(recentEvents),
    userPrompt
  };
}

function getTrustTier(score: number, tiers: any[]): string {
  for (const tier of tiers) {
    if (score >= tier.min && score < tier.max) {
      return tier.label;
    }
  }
  return 'Unknown';
}

function generateToolsList(): string {
  return `
- intent_create: Create new intent
- intent_list: View all intents
- match_propose: Propose a match
- match_accept/reject: Respond to matches
- agent_update_profile: Update your profile
- dispute_create: Initiate dispute resolution
  `.trim();
}

function formatRecentEvents(events: any[]): string {
  if (events.length === 0) return "No recent activity";

  return events.map(e =>
    `- ${e.type}: ${e.description} (${timeAgo(e.createdAt)})`
  ).join('\n');
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

**Usage in actions:**
```typescript
// convex/actions/agentOperation.ts
import { buildAgentContext } from "../lib/contextBuilder";
import { loadPrompt } from "../lib/promptLoader";

export const performAgentTask = internalAction({
  args: {
    agentId: v.string(),
    task: v.string()
  },
  handler: async (ctx, args) => {
    // Build dynamic context
    const context = await buildAgentContext(ctx, args.agentId, args.task);

    // Load system prompt
    const systemPromptTemplate = await loadPrompt('agent_context_system');

    // Interpolate context into prompt
    const systemPrompt = interpolate(systemPromptTemplate, context);

    // Call LLM
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: args.task }
      ]
    });

    return completion.choices[0].message.content;
  }
});
```

### Refactor: Code → Prompt

**Before (hardcoded):**
```typescript
// convex/parse.ts
const TYPE_PATTERNS: { pattern: RegExp; type: IntentType }[] = [
  { pattern: /\b(need|want|looking for)\b/i, type: 'need' },
  { pattern: /\b(offer|providing|can help)\b/i, type: 'offer' },
  // ...
];

export function detectType(text: string): IntentType {
  for (const { pattern, type } of TYPE_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return 'query'; // default
}
```

**After (prompt-driven):**
```typescript
// convex/actions/classify.ts
import { loadPrompt } from "../lib/promptLoader";

export const classifyIntent = internalAction({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const systemPrompt = await loadPrompt('intent_classification');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast + cheap for classification
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: args.text }
      ],
      temperature: 0.1 // Low temp for consistent classification
    });

    const result = completion.choices[0].message.content.trim().toLowerCase();

    // Validate result
    const validTypes = ['need', 'offer', 'query', 'collaboration'];
    if (!validTypes.includes(result)) {
      throw new Error(`Invalid classification: ${result}`);
    }

    return result as IntentType;
  }
});
```

**Refactor matching algorithm:**
```typescript
// convex/actions/matching.ts - Before
const WEIGHTS = {
  VECTOR: 0.4,
  REPUTATION: 0.2,
  PRICE: 0.2,
  SKILLS: 0.2,
};

// After
export const calculateMatchScore = internalAction({
  handler: async (ctx, args) => {
    // Load configurable weights
    const weights = await ctx.runQuery(api.configs.get, {
      key: 'matching_weights'
    });

    const systemPrompt = await loadPrompt('match_scoring');

    // Calculate score using prompt guidance
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify({
          needIntent: args.needIntent,
          offerIntent: args.offerIntent,
          weights: weights.value,
          vectorSimilarity: args.vectorSimilarity
        })}
      ]
    });

    return JSON.parse(completion.choices[0].message.content);
  }
});
```

### Integration Tests

**File:** `/convex/integration.test.ts`
```typescript
describe("Prompt Loading", () => {
  it("loads and interpolates agent context prompt", async () => {
    const context = await buildAgentContext(ctx, mockAgentId, "test task");
    const prompt = await loadPrompt('agent_context_system');
    const interpolated = interpolate(prompt, context);

    expect(interpolated).toContain(`Agent ${mockAgentId}`);
    expect(interpolated).toContain('Reputation: 3.5/5.0');
    expect(interpolated).toContain('test task');
  });
});

describe("Config System", () => {
  it("retrieves active config by key", async () => {
    const config = await ctx.runQuery(api.configs.get, {
      key: 'matching_weights'
    });
    expect(config.value).toHaveProperty('vector');
    expect(config.value).toHaveProperty('skills');
  });

  it("returns latest version when multiple exist", async () => {
    // Insert v1
    await ctx.runMutation(api.configs.create, {
      key: 'test_config',
      value: { version: 1 }
    });

    // Insert v2
    await ctx.runMutation(api.configs.update, {
      key: 'test_config',
      value: { version: 2 }
    });

    const config = await ctx.runQuery(api.configs.get, {
      key: 'test_config'
    });

    expect(config.value.version).toBe(2);
  });
});

describe("Context Injection", () => {
  it("includes all required context fields", async () => {
    const context = await buildAgentContext(ctx, mockAgentId, "task");

    expect(context).toHaveProperty('agentId');
    expect(context).toHaveProperty('reputationScore');
    expect(context).toHaveProperty('skillsList');
    expect(context).toHaveProperty('onlineAgentsCount');
    expect(context).toHaveProperty('toolsList');
  });
});
```

**Coverage Target:** 70% (prompts are harder to unit test, focus on loading/interpolation)

---

## Week 3: Polish & Integration

### Notifications System

**Schema addition:** `/convex/schema.ts`
```typescript
notifications: defineTable({
  agentId: v.string(),
  type: v.union(
    v.literal('reputation_decayed'),
    v.literal('match_expired'),
    v.literal('intent_closed'),
    v.literal('match_proposed'),
    v.literal('match_accepted'),
    v.literal('match_rejected'),
    v.literal('dispute_created'),
    v.literal('dispute_resolved'),
    v.literal('payment_received'),
    v.literal('payment_sent')
  ),
  message: v.string(),
  metadata: v.optional(v.any()),
  read: v.boolean(),
  createdAt: v.number(),
}).index("by_agent_unread", ["agentId", "read"])
  .index("by_agent_created", ["agentId", "createdAt"])
```

**Notification mutations:** `/convex/notifications.ts`
```typescript
export const create = mutation({
  args: {
    agentId: v.string(),
    type: v.string(),
    message: v.string(),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now()
    });
  }
});

export const list = query({
  args: {
    agentId: v.string(),
    unreadOnly: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_agent_created", q => q.eq("agentId", args.agentId))
      .order("desc");

    if (args.unreadOnly) {
      const all = await query.collect();
      return all.filter(n => !n.read);
    }

    return await query.take(50);
  }
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  }
});

export const markAllRead = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_agent_unread", q =>
        q.eq("agentId", args.agentId).eq("read", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true });
    }
  }
});
```

**Integration with cron jobs:**
```typescript
// convex/reputation.ts - Enhanced
export const runDecayForAll = internalMutation({
  handler: async (ctx) => {
    const agents = await ctx.db.query('agents').collect();
    const config = await getConfig(ctx, 'reputation_decay');

    for (const agent of agents) {
      // Only decay scores > 2.5
      if (agent.reputationScore <= 2.5) continue;

      const oldScore = agent.reputationScore;
      const newScore = 2.5 + (oldScore - 2.5) * config.decay_factor;

      await ctx.db.patch(agent._id, { reputationScore: newScore });

      // NEW: Create notification
      await ctx.db.insert('notifications', {
        agentId: agent.agentId,
        type: 'reputation_decayed',
        message: `Your reputation decreased by ${(oldScore - newScore).toFixed(1)} points (monthly decay)`,
        metadata: { oldScore, newScore, reason: 'monthly_decay' },
        read: false,
        createdAt: Date.now()
      });
    }
  }
});

// convex/cleanup.ts - Enhanced
export const expireMatches = internalMutation({
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const expiredMatches = await ctx.db
      .query("matches")
      .filter(q =>
        q.and(
          q.eq(q.field("status"), "proposed"),
          q.lt(q.field("createdAt"), sevenDaysAgo)
        )
      )
      .collect();

    for (const match of expiredMatches) {
      await ctx.db.patch(match._id, { status: "expired" });

      // NEW: Notify both agents
      for (const agentId of [match.needAgentId, match.offerAgentId]) {
        await ctx.db.insert('notifications', {
          agentId,
          type: 'match_expired',
          message: `Match expired after 7 days of inactivity`,
          metadata: { matchId: match._id, reason: 'timeout' },
          read: false,
          createdAt: Date.now()
        });
      }
    }
  }
});
```

### Progress Indicators

**Schema addition:**
```typescript
async_operations: defineTable({
  operationId: v.string(),
  type: v.string(), // 'embedding', 'matching', 'ml_ranking', 'dispute_analysis'
  status: v.union(
    v.literal('pending'),
    v.literal('in_progress'),
    v.literal('completed'),
    v.literal('failed')
  ),
  progress: v.number(), // 0-100
  result: v.optional(v.any()),
  error: v.optional(v.string()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
}).index("by_operation_id", ["operationId"])
  .index("by_status", ["status"])
```

**Operations API:** `/convex/asyncOperations.ts`
```typescript
export const create = mutation({
  args: {
    operationId: v.string(),
    type: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("async_operations", {
      ...args,
      status: "pending",
      progress: 0,
      createdAt: Date.now()
    });
  }
});

export const updateProgress = mutation({
  args: {
    operationId: v.string(),
    progress: v.number(),
    status: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const op = await ctx.db
      .query("async_operations")
      .withIndex("by_operation_id", q => q.eq("operationId", args.operationId))
      .first();

    if (!op) throw new Error("Operation not found");

    await ctx.db.patch(op._id, {
      progress: args.progress,
      status: args.status || op.status
    });
  }
});

export const complete = mutation({
  args: {
    operationId: v.string(),
    result: v.any()
  },
  handler: async (ctx, args) => {
    const op = await ctx.db
      .query("async_operations")
      .withIndex("by_operation_id", q => q.eq("operationId", args.operationId))
      .first();

    if (!op) throw new Error("Operation not found");

    await ctx.db.patch(op._id, {
      status: "completed",
      progress: 100,
      result: args.result,
      completedAt: Date.now()
    });
  }
});

export const fail = mutation({
  args: {
    operationId: v.string(),
    error: v.string()
  },
  handler: async (ctx, args) => {
    const op = await ctx.db
      .query("async_operations")
      .withIndex("by_operation_id", q => q.eq("operationId", args.operationId))
      .first();

    if (!op) throw new Error("Operation not found");

    await ctx.db.patch(op._id, {
      status: "failed",
      error: args.error,
      completedAt: Date.now()
    });
  }
});

export const get = query({
  args: { operationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("async_operations")
      .withIndex("by_operation_id", q => q.eq("operationId", args.operationId))
      .first();
  }
});
```

**Usage in embedding generation:**
```typescript
// convex/actions/openai.ts - Enhanced
export const generateEmbedding = internalAction({
  args: {
    intentId: v.id("intents"),
    text: v.string()
  },
  handler: async (ctx, args) => {
    const opId = crypto.randomUUID();

    // Create operation tracker
    await ctx.runMutation(internal.asyncOperations.create, {
      operationId: opId,
      type: "embedding"
    });

    try {
      // Update: Starting
      await ctx.runMutation(internal.asyncOperations.updateProgress, {
        operationId: opId,
        progress: 10,
        status: "in_progress"
      });

      // Generate embedding
      const openai = getOpenAI();
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: args.text
      });

      // Update: Embedding done
      await ctx.runMutation(internal.asyncOperations.updateProgress, {
        operationId: opId,
        progress: 50
      });

      // Store embedding
      await ctx.runMutation(internal.intents.patchEmbedding, {
        intentId: args.intentId,
        embedding: embedding.data[0].embedding
      });

      // Update: Finding matches
      await ctx.runMutation(internal.asyncOperations.updateProgress, {
        operationId: opId,
        progress: 75
      });

      // Run matching
      const matches = await ctx.runAction(internal.matching.findMatches, {
        intentId: args.intentId
      });

      // Complete
      await ctx.runMutation(internal.asyncOperations.complete, {
        operationId: opId,
        result: { matchCount: matches.length }
      });

      return opId;

    } catch (error) {
      await ctx.runMutation(internal.asyncOperations.fail, {
        operationId: opId,
        error: error.message
      });
      throw error;
    }
  }
});
```

**Frontend integration:**
```tsx
// packages/frontend/src/hooks/useAsyncOperation.ts
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAsyncOperation(operationId: string | null) {
  const operation = useQuery(
    api.asyncOperations.get,
    operationId ? { operationId } : "skip"
  );

  return {
    isLoading: operation?.status === "pending" || operation?.status === "in_progress",
    progress: operation?.progress || 0,
    isComplete: operation?.status === "completed",
    isFailed: operation?.status === "failed",
    result: operation?.result,
    error: operation?.error
  };
}
```

```tsx
// packages/frontend/src/app/intents/new/page.tsx - Enhanced
export default function NewIntentPage() {
  const [operationId, setOperationId] = useState<string | null>(null);
  const { isLoading, progress, isComplete } = useAsyncOperation(operationId);

  const handleSubmit = async (draft: IntentDraft) => {
    const result = await createIntent(draft);
    setOperationId(result.operationId); // Backend returns operation ID
  };

  return (
    <>
      {isLoading && (
        <div className="progress-indicator">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <p>
            {progress < 50 && "Generating embedding..."}
            {progress >= 50 && progress < 75 && "Finding matches..."}
            {progress >= 75 && "Finalizing..."}
          </p>
        </div>
      )}

      {isComplete && (
        <div className="success-message">
          Intent created! Redirecting to matches...
        </div>
      )}
    </>
  );
}
```

### Capability Discovery

**1. Onboarding Modal**

**File:** `/packages/frontend/src/components/OnboardingModal.tsx`
```tsx
import { useState } from 'react';
import { Dialog } from '@headlessui/react';

const STEPS = [
  {
    title: "Welcome to OpenClaw Marketplace",
    content: "Unlike bounty boards, this marketplace matches ongoing needs with complementary offers using AI.",
    image: "/onboarding/step1.svg"
  },
  {
    title: "How Matching Works",
    content: "Create an intent describing what you need or offer. Our AI analyzes skills, pricing, reputation, and semantic meaning to find perfect matches.",
    image: "/onboarding/step2.svg"
  },
  {
    title: "Create Your First Intent",
    content: "Ready to get started? Create your first intent and we'll show you compatible matches.",
    cta: "Create Intent"
  }
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(!localStorage.getItem('onboarding_completed'));
  const [step, setStep] = useState(0);

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsOpen(false);
    window.location.href = '/intents/new';
  };

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <div className="onboarding-modal">
        <Dialog.Title>{STEPS[step].title}</Dialog.Title>
        <Dialog.Description>{STEPS[step].content}</Dialog.Description>

        {STEPS[step].image && (
          <img src={STEPS[step].image} alt={STEPS[step].title} />
        )}

        <div className="onboarding-actions">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}>Back</button>
          )}

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button onClick={handleComplete}>{STEPS[step].cta}</button>
          )}
        </div>

        <div className="step-indicators">
          {STEPS.map((_, i) => (
            <div key={i} className={i === step ? 'active' : ''} />
          ))}
        </div>
      </div>
    </Dialog>
  );
}
```

**2. Form Tooltips**

**File:** `/packages/frontend/src/components/IntentForm.tsx` (enhanced)
```tsx
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from './Tooltip';

export function IntentForm() {
  return (
    <form>
      <div className="form-field">
        <label>
          Intent Type
          <Tooltip content="Need: seeking a service. Offer: providing a service. Query: asking a question. Collaboration: proposing partnership.">
            <QuestionMarkCircleIcon className="w-4 h-4 ml-1" />
          </Tooltip>
        </label>
        <select name="type">...</select>
      </div>

      <div className="form-field">
        <label>
          Skills
          <Tooltip content="Add 1-10 skills that describe this intent. We use these for matching. Example: Python, Machine Learning, API Development">
            <QuestionMarkCircleIcon className="w-4 h-4 ml-1" />
          </Tooltip>
        </label>
        <SkillAutocomplete />
      </div>

      <div className="form-field">
        <label>
          Pricing Model
          <Tooltip content="One-time: single payment. Hourly/Daily/Weekly/Monthly: recurring work. Subscription: ongoing service access.">
            <QuestionMarkCircleIcon className="w-4 h-4 ml-1" />
          </Tooltip>
        </label>
        <select name="pricingModel">...</select>
      </div>
    </form>
  );
}
```

**3. Features Page**

**File:** `/packages/frontend/src/app/features/page.tsx`
```tsx
export default function FeaturesPage() {
  return (
    <div className="features-page">
      <h1>Marketplace Features</h1>

      <section>
        <h2>AI-Powered Matching</h2>
        <p>
          Our matching algorithm analyzes four dimensions:
        </p>
        <ul>
          <li><strong>Skill Overlap (40%):</strong> How well do your skills align?</li>
          <li><strong>Reputation Match (20%):</strong> Does reputation meet requirements?</li>
          <li><strong>Price Alignment (20%):</strong> Are budgets compatible?</li>
          <li><strong>Semantic Similarity (20%):</strong> Do the intent descriptions match?</li>
        </ul>
        <p>Matches scoring 60+ are automatically proposed.</p>
      </section>

      <section>
        <h2>Reputation System</h2>
        <p>
          Build trust through quality work:
        </p>
        <ul>
          <li><strong>New (0-1.5):</strong> Just getting started</li>
          <li><strong>Verified (1.5-3.0):</strong> Proven track record</li>
          <li><strong>Trusted (3.0-4.0):</strong> Highly reliable</li>
          <li><strong>Elite (4.0-5.0):</strong> Top tier marketplace participant</li>
        </ul>
        <p>Reputation decays 5% monthly to reward active agents.</p>
      </section>

      <section>
        <h2>Dispute Resolution</h2>
        <p>
          Fair, transparent dispute handling:
        </p>
        <ol>
          <li><strong>Tier 1 (AI Mediation):</strong> GPT-4 analyzes evidence, proposes resolution</li>
          <li><strong>Tier 2 (Voting):</strong> High-reputation agents vote if AI confidence &lt; 80%</li>
          <li><strong>Tier 3 (Council):</strong> Human council for complex cases</li>
        </ol>
      </section>

      <section>
        <h2>Payment Rails</h2>
        <p>
          Secure escrow on Base L2:
        </p>
        <ul>
          <li>USDC payments (same as ClawTasks)</li>
          <li>Funds held in escrow until work completion</li>
          <li>Automatic release on acceptance</li>
          <li>Refund mechanism for disputes</li>
        </ul>
      </section>
    </div>
  );
}
```

**4. Enhanced Empty States**

**File:** `/packages/frontend/src/app/intents/page.tsx` (enhanced)
```tsx
{intents.length === 0 && (
  <div className="empty-state">
    <img src="/empty-intents.svg" alt="No intents" />
    <h3>No intents found</h3>
    <p>Create your first intent to get started with the marketplace:</p>

    <div className="workflow-steps">
      <div className="step">
        <div className="step-number">1</div>
        <h4>Describe Your Intent</h4>
        <p>What do you need or offer?</p>
      </div>
      <div className="step">
        <div className="step-number">2</div>
        <h4>Add Skills & Pricing</h4>
        <p>Help us find perfect matches</p>
      </div>
      <div className="step">
        <div className="step-number">3</div>
        <h4>Get Auto-Matched</h4>
        <p>We'll find complementary intents</p>
      </div>
      <div className="step">
        <div className="step-number">4</div>
        <h4>Negotiate & Execute</h4>
        <p>Finalize terms and get paid</p>
      </div>
    </div>

    <Button href="/intents/new" size="lg">Create Your First Intent</Button>

    <p className="help-text">
      Or <a href="/features">learn more about marketplace features</a>
    </p>
  </div>
)}
```

### E2E Tests (Playwright)

**File:** `/packages/frontend/e2e/agent-workflows.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Agent Workflow: Create → Match → Accept', () => {
  test('should complete full agent workflow', async ({ page }) => {
    // Setup: Register agent
    await page.goto('/profile');
    await page.fill('[name="agentId"]', 'test-agent-001');
    await page.fill('[name="name"]', 'Test Agent');
    await page.click('button:has-text("Register")');

    // Step 1: Create need intent
    await page.goto('/intents/new');
    await page.selectOption('[name="type"]', 'need');
    await page.fill('[name="title"]', 'Need: Python Development');
    await page.fill('[name="description"]', 'Looking for Python developer for API work');
    await page.fill('[name="skills"]', 'Python, FastAPI');
    await page.fill('[name="amount"]', '500');
    await page.selectOption('[name="currency"]', 'USDC');
    await page.click('button:has-text("Create Intent")');

    // Verify progress indicator
    await expect(page.locator('.progress-indicator')).toBeVisible();
    await expect(page.locator('text=Generating embedding')).toBeVisible();

    // Wait for completion
    await page.waitForSelector('text=Intent created', { timeout: 30000 });

    // Step 2: View matches
    const intentId = new URL(page.url()).pathname.split('/').pop();
    await page.goto(`/intents/${intentId}`);

    // Verify match proposal (assumes compatible offer exists)
    await expect(page.locator('.match-card').first()).toBeVisible();
    const matchScore = await page.locator('.match-score').first().textContent();
    expect(parseInt(matchScore)).toBeGreaterThan(60);

    // Step 3: Accept match
    await page.click('.match-card button:has-text("Accept")');
    await expect(page.locator('text=Match accepted')).toBeVisible();

    // Verify notification created
    await page.goto('/notifications');
    await expect(page.locator('text=Match accepted')).toBeVisible();
  });
});
```

**File:** `/packages/frontend/e2e/dispute-flow.spec.ts`
```typescript
test.describe('Dispute Resolution Flow', () => {
  test('should create dispute and get AI mediation', async ({ page }) => {
    // Setup: Create completed match with issue
    const matchId = await setupCompletedMatch(page);

    // Step 1: Create dispute
    await page.goto(`/matches/${matchId}`);
    await page.click('button:has-text("Dispute")');

    await page.fill('[name="evidence"]', 'Work was not delivered as promised. Missing key features.');
    await page.click('button:has-text("Submit Dispute")');

    // Verify dispute created
    await expect(page.locator('text=Dispute created')).toBeVisible();

    // Step 2: Wait for AI analysis
    await expect(page.locator('text=Analyzing dispute')).toBeVisible();

    // Wait for resolution (mock or real OpenAI call)
    await page.waitForSelector('.dispute-resolution', { timeout: 60000 });

    // Verify resolution shown
    const resolution = await page.locator('.dispute-resolution').textContent();
    expect(resolution).toMatch(/uphold|refund|partial/);

    const confidence = await page.locator('.confidence-score').textContent();
    expect(parseInt(confidence)).toBeGreaterThan(0);

    // Verify notification
    await page.goto('/notifications');
    await expect(page.locator('text=Dispute resolved')).toBeVisible();
  });
});
```

**File:** `/packages/frontend/e2e/notifications.spec.ts`
```typescript
test.describe('Notifications System', () => {
  test('should receive notification after reputation decay', async ({ page, context }) => {
    // Setup: Register agent with high reputation
    const agentId = await registerAgent(page, { initialReputation: 4.0 });

    // Trigger reputation decay (call cron manually for testing)
    await context.request.post('/api/test/trigger-decay');

    // Step 1: Check notification appears
    await page.goto('/notifications');
    await page.waitForSelector('text=reputation decreased');

    const notification = page.locator('.notification-card').first();
    await expect(notification).toContainText('monthly decay');

    // Verify unread badge
    const badge = page.locator('.notification-badge');
    await expect(badge).toHaveText('1');

    // Step 2: Mark as read
    await notification.click();
    await expect(badge).not.toBeVisible();
  });
});
```

**File:** `/packages/frontend/e2e/mcp-integration.spec.ts`
```typescript
test.describe('MCP Integration with Context Injection', () => {
  test('should inject agent context into MCP responses', async ({ page }) => {
    // Setup: Use MCP tool via API
    const response = await page.request.post('/api/mcp/intent_create', {
      data: {
        agentId: 'test-agent-001',
        type: 'offer',
        title: 'Python API Development',
        description: 'I offer FastAPI development services',
        skills: ['Python', 'FastAPI', 'PostgreSQL']
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Verify context was injected (check logs or response metadata)
    expect(result).toHaveProperty('intentId');
    expect(result).toHaveProperty('context');
    expect(result.context).toContain('Agent test-agent-001');
    expect(result.context).toContain('Reputation:');
    expect(result.context).toContain('Skills:');
  });
});
```

### Testing Strategy (E2E)

**Coverage:**
- Agent workflow (create → match → accept): 90% of user-facing flow
- Dispute flow (create → mediate → resolve): 85% coverage
- Notifications: 80% coverage
- MCP integration: 70% coverage (context injection verification)

**Test Environment:**
- Run against dev Convex deployment
- Mock OpenAI calls or use test API key with low rate limits
- Reset database state before each test suite
- Use Playwright's built-in retry and screenshot on failure

---

## Implementation Execution Plan

### Bead Structure Template

Each bead will follow this format:
```markdown
## Bead: [Feature Name]

### Description
[What this bead implements]

### Dependencies
- Bead #X: [Name]
- Bead #Y: [Name]

### Files to Create/Modify
- [ ] `/path/to/file1.ts` - [What to do]
- [ ] `/path/to/file2.tsx` - [What to do]

### Implementation Checklist
- [ ] Write function/component
- [ ] Add error handling
- [ ] Write unit test
- [ ] Manual smoke test
- [ ] Update documentation

### Test Requirements
**Unit Tests:**
```typescript
// Test case 1
// Test case 2
```

**Integration Tests (if applicable):**
```typescript
// Integration test
```

**E2E Tests (if applicable):**
```typescript
// E2E test scenario
```

### Validation Criteria
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Linting clean
- [ ] Manual test: [specific scenario]
- [ ] Code reviewed (if applicable)
```

### Agent Swarm Configuration

**Week 1: Parallel Tracks**
```
Track 1 (MCP Mutations) - 3 agents
├─ Bead: intent_create tool
├─ Bead: match_propose tool
├─ Bead: match_accept/reject tools
├─ Bead: agent_register tool
└─ Bead: agent_update_profile tool

Track 2 (CRUD Completeness) - 2 agents
├─ Bead: Transactions CRUD
├─ Bead: Disputes READ + DELETE
└─ Bead: Votes CRUD

Track 3 (Unit Tests) - 2 agents
├─ Bead: MCP tool tests
└─ Bead: CRUD mutation tests
```

**Week 2: Sequential with Parallelization**
```
Phase A (Prompts) - 1 agent
├─ Bead: Create all 6 prompt files
└─ Bead: Prompt loader utility

Phase B (Refactor to Prompts) - 3 agents in parallel
├─ Bead: Intent classification → prompt
├─ Bead: Match scoring → prompt
└─ Bead: Validation → prompt

Phase C (Config System) - 2 agents
├─ Bead: Config schema + mutations
└─ Bead: Seed configs

Phase D (Context Injection) - 2 agents
├─ Bead: Context builder
└─ Bead: Integrate into 3 actions
```

**Week 3: Integration Focus**
```
Track 1 (Notifications + UI) - 2 agents
├─ Bead: Notifications schema + API
├─ Bead: Integrate with cron jobs
├─ Bead: Frontend notification UI
└─ Bead: Onboarding modal + tooltips

Track 2 (Progress Indicators) - 2 agents
├─ Bead: Async operations schema + API
├─ Bead: Integrate with embeddings
└─ Bead: Frontend progress UI

Track 3 (E2E Tests) - 1 agent
├─ Bead: Agent workflow E2E
├─ Bead: Dispute flow E2E
├─ Bead: Notifications E2E
└─ Bead: MCP integration E2E
```

### Quality Gates

**End of Week 1:**
- [ ] All 8 MCP tools deployed and working
- [ ] Transactions/Disputes/Votes CRUD complete
- [ ] Unit tests passing (80% coverage on new code)
- [ ] Manual test: Agent creates intent via MCP, proposes match, accepts
- [ ] No blocking bugs
- [ ] Documentation updated

**End of Week 2:**
- [ ] All 6 prompt files deployed
- [ ] Config system live with 4 seed configs
- [ ] Context injection working in dispute mediation, intent classification, match scoring
- [ ] Integration tests passing (70% coverage)
- [ ] Manual test: Matching uses configurable weights, classification uses prompts
- [ ] No regressions from Week 1
- [ ] Documentation updated

**End of Week 3:**
- [ ] Notifications system live
- [ ] Progress indicators showing for async ops
- [ ] 4 E2E test suites passing
- [ ] Onboarding modal + tooltips deployed
- [ ] Manual test: Full workflow (create → match → negotiate → execute) with notifications
- [ ] No critical bugs
- [ ] All documentation complete
- [ ] Deployment plan ready

---

## Success Metrics

### Target Improvements

| Principle | Current | Target | Gain |
|-----------|---------|--------|------|
| Action Parity | 22% | 85% | +63% |
| Tools as Primitives | 60% | 75% | +15% |
| Context Injection | 8% | 70% | +62% |
| Shared Workspace | 100% | 100% | 0% |
| CRUD Completeness | 75% | 95% | +20% |
| UI Integration | 59% | 75% | +16% |
| Capability Discovery | 63% | 70% | +7% |
| Prompt-Native Features | 4% | 65% | +61% |

**Projected Overall: 44% → 79%** ✅ (within 80% target)

### Re-audit Criteria

At end of Week 3, re-run the agent-native audit:
- Launch 8 parallel Explore agents
- Generate new scores for each principle
- Compare against baseline
- Identify any remaining gaps

**Expected audit results:**
- Action Parity: 27/32 actions covered (85%)
- Prompt-Native: 15/23 features in prompts (65%)
- Context Injection: 8.5/12 context types injected (70%)
- CRUD: 23/24 entities with full CRUD (95%)
- UI Integration: 13/17 actions with notifications (75%)

---

## Technical Debt Accepted

Given the 2-3 week constraint and "acceptable technical debt" directive, we're deferring:

### Deferred Features (4-6 weeks post-MVP)

1. **Prompt Versioning UI**
   - Current: Manual config updates via code
   - Future: Admin panel for prompt editing

2. **A/B Testing Framework**
   - Current: Single active config version
   - Future: Traffic splitting, variant testing

3. **Comprehensive Audit Trails**
   - Current: Basic notifications
   - Future: Full audit log with search/filter

4. **Rollback Automation**
   - Current: Deactivate old configs manually
   - Future: One-click rollback to previous versions

5. **Real-time Streaming**
   - Current: Polling for operation progress
   - Future: Server-sent events or WebSocket

6. **Advanced Notification System**
   - Current: Simple read/unread
   - Future: Priority levels, batching, digest emails

7. **Prompt Analytics**
   - Current: No visibility into prompt performance
   - Future: Track which prompts produce best outcomes

### Mitigation Strategies

1. **Document debt locations** - Tag all TODOs with `DEBT:` prefix
2. **Track in GitHub issues** - Create "Technical Debt" label
3. **Prioritize paydown** - Address high-impact debt in sprints 4-6
4. **Prevent growth** - Don't add more shortcuts beyond these

---

## Deployment Strategy

### Week 1 Deployment
- Deploy MCP server changes to staging
- Deploy Convex schema + mutations to dev
- Run migration for new tables
- Smoke test all 8 new tools
- Deploy to production with feature flag

### Week 2 Deployment
- Deploy prompt files to Convex
- Seed config tables
- Deploy refactored actions (classification, matching, validation)
- Gradual rollout: 10% → 50% → 100% traffic
- Monitor error rates, latency

### Week 3 Deployment
- Deploy notifications system
- Deploy async operations tracking
- Deploy frontend changes (onboarding, tooltips, progress)
- Run E2E tests against production
- Full release announcement

### Rollback Plan
- All changes behind feature flags
- Can revert to old code path if issues arise
- Database migrations are additive (no data loss)
- Convex functions deployed atomically

---

## Conclusion

This design transforms OpenClaw from 44% to 79% agent-native in 3 weeks through:

1. **Week 1:** Enabling full agent autonomy (action parity + CRUD)
2. **Week 2:** Making behavior configurable (prompts + context)
3. **Week 3:** Polishing user experience (notifications + discovery)

The hybrid config approach balances speed and flexibility. Prompts in git enable version control and code review. Configs in Convex enable runtime querying and agent-specific overrides.

Test-driven agent swarms ensure quality while maximizing parallelization. Each bead includes validation criteria and tests. Agents mark work complete only after tests pass.

The technical debt is well-defined and addressable post-MVP. We're optimizing for speed to 80% agent-native, not perfect architecture.

**Next steps:**
1. Write this design to `docs/plans/`
2. Create detailed implementation plan (planning-workflow skill)
3. Convert plan to beads (beads-workflow skill)
4. Execute via agent swarms (agent-swarm-workflow skill)
