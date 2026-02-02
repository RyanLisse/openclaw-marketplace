# Convex Migration Plan

**Date:** 2026-02-02  
**Decision:** Replace PostgreSQL + Redis + WebSocket with Convex  
**Reason:** Perfect alignment with agent-native architecture principles

---

## Architecture Changes

### Before (Traditional Stack)
```
Frontend (Next.js 16)
    ↓ REST API
Backend (Node.js/Express)
    ↓
PostgreSQL + Redis + Neo4j + WebSocket
    ↓
Smart Contracts (Base L2)
```

### After (Convex Stack)
```
Frontend (Next.js 16)
    ↓ Convex Client (reactive queries)
Convex Functions (TypeScript)
    ↓
Convex Database (reactive, real-time)
    ↓
Smart Contracts (Base L2)
```

---

## Bead Impact Analysis

### Beads ELIMINATED (No longer needed)

| Bead | Reason |
|------|--------|
| **clawd-2ci** - WebSocket backend | ✅ Convex subscriptions replace WebSocket |
| **clawd-jzs** - Redis caching | ✅ Convex reactivity = no cache needed |
| **clawd-y46** - Notification system | ✅ Convex subscriptions handle real-time |
| **clawd-8q7** - PostgreSQL setup | ✅ Convex database replaces PostgreSQL |

### Beads SIMPLIFIED

| Bead | Before | After |
|------|--------|-------|
| **clawd-8c0** - Intent CRUD API | Express routes + SQL | Convex mutations |
| **clawd-dhh** - Matching algorithm | Background job + Redis pub/sub | Convex action + reactive query |
| **clawd-af6** - Authentication | Custom JWT + session store | Convex Auth |
| **clawd-4tk** - Reputation scoring | Cron job + cache | Convex scheduled function |

### Beads ENHANCED

| Bead | Enhancement |
|------|-------------|
| **clawd-6cj** - Agent canvas | Real-time reactivity (no polling!) |
| **clawd-dhh** - Matching | Vector search with real-time updates |
| **clawd-4z3** - Graph database | Evaluate: Keep Neo4j for complex graphs, or use Convex with indexes |

### Beads UNCHANGED

| Bead | Reason |
|------|--------|
| **clawd-9a0** - Smart contracts | Blockchain layer stays separate |
| **clawd-bj3** - Contract integration | Convex can call contracts via actions |
| **clawd-ew0** - Frontend | Next.js frontend works great with Convex |
| **clawd-jr9** - Testing | E2E tests work the same |

---

## Migration Strategy

### Phase 1: Foundation (NEW clawd-cvx1)
- Install Convex: `npm create convex@latest`
- Set up `convex/` directory
- Configure `ConvexProvider` in Next.js
- Define initial schema (intents, agents, matches)

### Phase 2: Core Functions (NEW clawd-cvx2)
- Intent CRUD mutations
- Agent registration/update
- Match finding queries
- Reputation scoring

### Phase 3: Real-time Features (NEW clawd-cvx3)
- Canvas subscriptions
- Live agent activity feed
- Notification system
- Streaming agent responses

### Phase 4: Advanced (NEW clawd-cvx4)
- Vector similarity search for matching
- Scheduled functions for reputation decay
- File storage for agent profiles
- Smart contract integration via actions

---

## Agent-Native Benefits

### 1. Parity (Agents = Users)
```typescript
// Frontend uses this:
const intents = useQuery(api.intents.list);

// Agents use the SAME query:
const intents = await convexClient.query(api.intents.list);
```

### 2. Granularity (Atomic operations)
```typescript
// Not a workflow, just a mutation
export const createIntent = mutation({
  args: { type: v.string(), skills: v.array(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("intents", args);
  },
});
```

### 3. Composability (Outcomes via prompts)
```typescript
// Agent composes: create → match → notify
// Each is atomic, agent orchestrates
await client.mutation(api.intents.create, { ... });
const matches = await client.query(api.matches.find, { ... });
await client.mutation(api.notifications.send, { ... });
```

### 4. Emergent Capability (Real-time reactivity)
```typescript
// Canvas updates automatically when ANY agent creates intent
useQuery(api.intents.list); // Re-runs on DB change
```

### 5. Improvement (Schema evolution)
```typescript
// Add field without downtime
// Convex handles migration
npx convex deploy
```

---

## Tool Cluster: Convex Functions

### Intent Operations (7 tools)
- `intents.list` - Discovery
- `intents.get` - Detail
- `intents.create` - Create
- `intents.update` - Update
- `intents.delete` - Delete
- `intents.search` - Find
- `intents.complete` - Signal done

### Match Operations (5 tools)
- `matches.findForIntent` - Get matches
- `matches.accept` - Accept match
- `matches.reject` - Reject match
- `matches.negotiate` - Counter-offer
- `matches.finalize` - Complete

### Agent Operations (6 tools)
- `agents.register` - Join marketplace
- `agents.updateProfile` - Update skills
- `agents.getReputation` - Check score
- `agents.listActive` - See online agents
- `agents.subscribe` - Watch activity
- `agents.unregister` - Leave

---

## Neo4j Decision

**Option A: Keep Neo4j for complex graph queries**
- Pros: Best-in-class graph traversal
- Cons: Extra infrastructure, sync complexity

**Option B: Use Convex with indexes**
- Pros: Single backend, simpler ops
- Cons: Manual graph traversal code

**Recommendation:** Start with Convex-only. Add Neo4j later if graph queries become bottleneck.

---

## Cost Analysis

### Traditional Stack (Monthly)
- Supabase PostgreSQL: $25
- Redis Cloud: $20
- Neo4j AuraDB: $65
- Backend hosting (AWS): $50
- **Total: $160/month**

### Convex Stack (Monthly)
- Convex Starter: **$0** (2M reads, 1M writes)
- Convex Pro: **$25** (scales with usage)
- **Savings: $135/month minimum**

---

## Next Steps

1. Create 4 new beads for Convex migration phases
2. Mark 4 old beads as CANCELLED (no longer needed)
3. Update `clawd-8z7` (infrastructure) to use Convex
4. Begin Phase 1 implementation
