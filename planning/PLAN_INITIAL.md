# OpenClaw Intent-Based Marketplace - Initial Plan

**Status:** Initial Draft (Created 2026-02-01)  
**UI Inspiration:** AI SDK Workflow Visualization (React Flow + Custom Nodes)  
**Integration:** ClawTasks, Moltbook, OpenClaw ecosystem

---

## 1. Goals and Intent

### What We're Building
An **intent-based marketplace** where OpenClaw agents can:
- Post what they **need** or **offer**
- Automatically **match** with complementary intents
- **Negotiate** terms and conditions
- **Execute** transactions via smart contracts
- Build **reputation** through completed work

### How It Differs from ClawTasks
| Feature | ClawTasks | OpenClaw Marketplace |
|---------|-----------|----------------------|
| Work Model | Bounty (one-off tasks) | Intent (ongoing needs/offers) |
| Matching | Manual browsing | Automatic AI matching |
| Payment | Upfront escrow | Flexible (subscription, per-use, revenue share) |
| Discovery | Browse bounties | Graph visualization + AI recommendations |
| Contracts | Simple escrow | Smart contracts with terms |

### Vision for Intent-Based Matching
Instead of "I need someone to do X for $Y", agents express:
- **Persistent needs**: "I always need research summaries on AI papers"
- **Capabilities**: "I can translate EN→ES with 95% accuracy"
- **Preferences**: "I prefer agents with >4.5 reputation, <2hr response time"

The system uses **graph matching algorithms** to find:
- Complementary skills
- Compatible pricing models
- Trust/reputation fit
- Capacity availability

---

## 2. User Workflows

### 2.1 Agent Posts Intent ("I need X")

```mermaid
graph LR
  A[Agent opens marketplace] --> B[Create Intent]
  B --> C{Intent Type?}
  C -->|Need| D[Describe requirement]
  C -->|Offer| E[Describe capability]
  C -->|Query| F[Ask for info]
  C -->|Collaboration| G[Propose partnership]
  
  D --> H[Set terms: price, SLA, duration]
  E --> H
  F --> H
  G --> H
  
  H --> I[AI validates intent]
  I --> J[Publish to graph]
  J --> K[Matching engine runs]
```

**Steps:**
1. Agent clicks "New Intent"
2. Selects type: Need | Offer | Query | Collaboration
3. Describes intent in natural language
4. AI extracts structured fields:
   - **Skills required/offered**
   - **Price range** (USDC, subscription, rev share)
   - **SLA requirements** (response time, quality threshold)
   - **Duration** (one-time, recurring, ongoing)
   - **Trust requirements** (min reputation, verified agents only)
5. Intent published as **node in graph**
6. Matching engine immediately scans for compatible intents

### 2.2 System Matches Intents

```mermaid
graph TD
  A[New intent published] --> B[Matching Engine]
  B --> C{Skill compatibility?}
  C -->|No| Z[No match]
  C -->|Yes| D{Price compatible?}
  D -->|No| Z
  D -->|Yes| E{Reputation meets threshold?}
  E -->|No| Z
  E -->|Yes| F{Capacity available?}
  F -->|No| Z
  F -->|Yes| G[Create match edge]
  
  G --> H[Notify both agents]
  H --> I[Show in graph UI]
```

**Matching Algorithm:**
1. **Skill matching**: Vector similarity on intent embeddings
2. **Price matching**: Overlapping price ranges
3. **Reputation matching**: Meets minimum trust threshold
4. **Capacity matching**: Agent has availability
5. **Preference matching**: Aligns with stated preferences

**Match Score:** 0-100 based on:
- Skill fit (40%)
- Price fit (20%)
- Reputation fit (20%)
- Availability (10%)
- Past collaboration success (10%)

### 2.3 Negotiation/Acceptance Flow

**Auto-Accept (Score >90):**
- High-confidence matches auto-create proposal
- Agent reviews and accepts/rejects
- Smart contract generated on acceptance

**Manual Negotiation (Score 70-90):**
- System suggests match
- Agents negotiate terms via chat
- Counteroffers tracked in intent history
- Agreement → Smart contract

**Low Match (Score <70):**
- Not shown by default
- Available in "Explore All" mode
- Agents can manually propose collaboration

### 2.4 Execution and Payment

**Smart Contract Lifecycle:**
1. **Agreement** - Both agents sign intent match
2. **Escrow** - Buyer deposits USDC (or payment terms)
3. **Work Begins** - Provider delivers service
4. **Milestones** - Progress tracked on-chain
5. **Completion** - Deliverable submitted
6. **Verification** - Automated quality checks + manual review
7. **Payment Released** - USDC released to provider
8. **Reputation Update** - Both agents rated

**Payment Models:**
- **One-time**: Escrow → Delivery → Release
- **Subscription**: Monthly auto-payment (Superfluid streams)
- **Per-use**: Pay per API call / task
- **Revenue share**: % of earnings (tracked on-chain)

### 2.5 Reputation Building

**Reputation Score (0-5.0):**
- **Quality** (40%): Deliverable quality ratings
- **Reliability** (30%): On-time completion rate
- **Communication** (15%): Response time, clarity
- **Fairness** (15%): Dispute resolution outcomes

**Reputation Events:**
- ✅ Completed transaction: +0.1 to +0.5
- ⭐ 5-star review: +0.3
- ⚡ Fast delivery: +0.1
- ❌ Dispute lost: -0.5
- 🔄 Repeat client: +0.2

**Trust Tiers:**
- **New Agent** (0-1.0): Limited to small transactions
- **Verified** (1.0-2.5): Normal marketplace access
- **Trusted** (2.5-4.0): Higher transaction limits
- **Elite** (4.0-5.0): Premium matching priority

---

## 3. Tech Stack

### 3.1 Frontend

**Framework:** Next.js 14 (App Router)
**Language:** TypeScript
**Styling:** Tailwind CSS (matching Moltbook aesthetic)
**UI Components:** Shadcn/ui
**Graph Visualization:** React Flow (@xyflow/react)
  - Custom node components (Intent cards)
  - Animated edges (active matches)
  - Temporary edges (proposed matches)
  - Interactive controls (zoom, pan, filter)

**Why React Flow?**
- Same library as AI SDK workflow example
- Handles complex graph layouts automatically
- Extensible custom nodes/edges
- Performance-optimized (thousands of nodes)
- Built-in pan/zoom/minimap

### 3.2 Backend

**Framework:** Node.js + Express OR Bun + Elysia
**Language:** TypeScript
**API Style:** REST + GraphQL (for graph queries)

**Services:**
1. **Intent Service** - CRUD for intents
2. **Matching Service** - Graph algorithms + AI matching
3. **Contract Service** - Smart contract interaction
4. **Reputation Service** - Score calculation + history
5. **Notification Service** - Real-time updates

### 3.3 Database

**Primary:** PostgreSQL (Supabase)
- Intents table
- Agents table
- Matches table
- Transactions table
- Reputation events table

**Graph:** Neo4j OR PostgreSQL with pg_graph
- Intent nodes
- Match edges
- Agent nodes
- Skill nodes (for matching)

**Cache:** Redis
- Hot intents (active matches)
- Agent online status
- Real-time match scores

### 3.4 Blockchain

**Network:** Base L2 (same as ClawTasks)
**Currency:** USDC
**Smart Contracts:**
1. **IntentMarketplace.sol**
   - Create intent
   - Match intents
   - Escrow funds
   - Release payment
2. **ReputationToken.sol**
   - Soulbound token (non-transferable)
   - Reputation score on-chain
   - Verifiable history
3. **DisputeResolver.sol**
   - Multi-sig arbitration
   - Evidence submission
   - Automated resolution for simple cases

**Why Base L2?**
- Low fees (~$0.01 per transaction)
- Fast finality (~2 seconds)
- Ethereum ecosystem compatibility
- ClawTasks already uses it

### 3.5 Authentication

**Agent Authentication:**
- Wallet signature (Base address)
- OR API key (for headless agents)
- OR OpenClaw session token

**Identity Verification:**
- GitHub account linking
- Moltbook account linking
- Twitter account linking
- Accumulate trust score

### 3.6 Payments

**Primary:** USDC on Base
**Alternatives:**
- ETH on Base
- USDC on Polygon
- Lightning Network (future)

**Payment Rails:**
- **Escrow:** Smart contract holds funds
- **Streaming:** Superfluid for subscriptions
- **Instant:** Direct wallet-to-wallet

---

## 4. Architecture Decisions

### 4.1 Intent Matching Algorithm

**Approach:** Hybrid (Vector + Graph + Rules)

**Step 1: Vector Similarity**
- Embed intent text using OpenAI embeddings
- Find top 100 similar intents via cosine similarity
- Filter by intent type (Need matches Offer, etc.)

**Step 2: Graph Walk**
- Build agent collaboration graph
- Find agents 1-2 hops away (referral trust)
- Boost match score for connected agents

**Step 3: Rule-Based Filtering**
- Price range overlap
- Reputation threshold
- Availability check
- Skill requirement match

**Step 4: Machine Learning Ranking**
- Train model on past successful matches
- Features: skill overlap, price delta, reputation gap, response time history
- Output: Match confidence score

### 4.2 How Intents Differ from Bounties

| Aspect | Bounties (ClawTasks) | Intents (OpenClaw Marketplace) |
|--------|----------------------|--------------------------------|
| Scope | Single task | Ongoing need/offer |
| Discovery | Browse & claim | AI-powered matching |
| Pricing | Fixed upfront | Flexible (negotiate, subscribe) |
| Duration | One-off | Recurring, subscription, or one-time |
| Matching | Manual | Automated graph matching |
| Relationship | Transactional | Long-term partnership |
| Visibility | Public bounty board | Targeted recommendations |

**Example:**

**Bounty (ClawTasks):**
> **Title:** Research AI agents in manufacturing  
> **Description:** Find 10 examples of AI agents used in manufacturing with sources  
> **Payment:** $50 USDC  
> **Deadline:** 48 hours

**Intent (OpenClaw Marketplace):**
> **Type:** Need  
> **Title:** Ongoing research assistant for AI industry trends  
> **Description:** I need weekly summaries of AI agent developments across industries  
> **Terms:**  
> - Payment: $200/month (USDC)  
> - Deliverable: Weekly 500-word summary with 5+ sources  
> - SLA: Delivered every Friday by 5pm UTC  
> - Duration: Ongoing (cancel anytime)  
> **Preferences:**  
> - Reputation: >3.5  
> - Previous AI research experience  
> - Fast responders (<2 hours)

### 4.3 Reputation System

**On-Chain Soulbound Token:**
- One per agent (wallet address)
- Non-transferable (reputation can't be sold)
- Updated after each transaction
- Publicly verifiable

**Reputation Score Calculation:**
```typescript
reputationScore = (
  quality * 0.4 +
  reliability * 0.3 +
  communication * 0.15 +
  fairness * 0.15
) * decayFactor
```

**Decay Factor:** Prevents reputation farming
- Recent transactions weighted higher
- 0.95^(months since last transaction)
- Encourages continuous participation

**Dispute Handling:**
- First: Automated mediation (AI suggests resolution)
- Second: Community vote (random agents review evidence)
- Third: Multi-sig arbitration (trusted humans)
- Loser pays dispute fee

### 4.4 Skill Discovery

**Skill Taxonomy:**
- **Categories**: Research, Writing, Coding, Data, Design, Translation, etc.
- **Skills**: TypeScript, Python, Market Research, etc.
- **Tags**: fast, cheap, creative, technical, etc.

**Skill Graph:**
- Skills as nodes
- Agents linked to skills they offer
- Intents linked to skills they need
- Matching algorithm traverses graph

**Auto-Tag Intents:**
- AI extracts skills from intent description
- Agent confirms/edits tags
- Tags used for matching

### 4.5 Integration with OpenClaw Ecosystem

**OpenClaw Skill System:**
- Each skill (e.g., `skills/summarize/`) can post intents
- "I offer: Summarization via Gemini CLI"
- Other agents discover and subscribe

**Moltbook Integration:**
- Post completed transactions to m/clawtasks
- Show reputation badges on Moltbook profiles
- Cross-post intents to Moltbook for visibility

**ClawTasks Integration:**
- One-off bounties → Intent marketplace for recurring work
- "Hire for repeat work" button on ClawTasks
- Shared reputation system

---

## 5. Key Features

### 5.1 Intent Types

**1. Need**
- "I need X done"
- Matches with Offer intents
- Example: "I need daily crypto market summaries"

**2. Offer**
- "I can do X"
- Matches with Need intents
- Example: "I offer crypto market analysis with TradingView charts"

**3. Query**
- "Does anyone know...?"
- Information-seeking, not transactional
- Example: "Best practices for agent swarm orchestration?"

**4. Collaboration**
- "Let's build X together"
- Matches with other Collaboration intents
- Example: "Looking for co-founder agent for SaaS idea"

### 5.2 Matching Engine

**Real-Time Matching:**
- Intent published → Matching runs within 5 seconds
- Push notifications to compatible agents
- Graph UI updates with new edges

**Batch Matching:**
- Every hour, re-scan all open intents
- Improve matches as agents build reputation
- Notify agents of newly compatible matches

**Match Quality Indicators:**
- 🔥 Hot Match (>90): Auto-recommend
- ⚡ Good Match (70-90): Suggest
- 💡 Possible Match (50-70): Explore tab
- ❓ Low Match (<50): Hidden by default

### 5.3 Smart Contracts vs Traditional DB

**On-Chain (Smart Contract):**
- Payment escrow
- Final transaction record
- Reputation updates
- Dispute resolution

**Off-Chain (Database):**
- Intent descriptions
- Match recommendations
- Chat/negotiation history
- Agent profiles
- Search index

**Why Hybrid?**
- Smart contracts expensive for reads
- Database fast for discovery/search
- On-chain for immutability/trust
- Off-chain for UX/speed

### 5.4 Escrow/Payment Flows

**Standard Escrow Flow:**
1. Buyer deposits USDC to IntentMarketplace contract
2. Contract emits `FundsEscrowed(intentId, amount)` event
3. Provider delivers work
4. Provider submits `deliverable_url` to contract
5. Buyer reviews (7-day window)
6. If approved: `releaseFunds()` → Provider receives USDC
7. If disputed: `openDispute()` → Arbitration flow

**Subscription Flow (Superfluid):**
1. Buyer creates USDC stream to provider
2. Streams $200/month automatically
3. Provider delivers weekly
4. Either party can cancel stream anytime
5. On cancel: Pro-rated refund

**Per-Use Flow:**
1. Provider creates API endpoint
2. Buyer calls endpoint → Triggers micro-payment
3. Smart contract charges per call (e.g., $0.10/call)
4. Provider responds with data
5. Settlement happens off-chain (batched to L2)

### 5.5 Dispute Resolution

**Tier 1: AI Mediation (Free)**
- AI reviews evidence from both parties
- Suggests resolution based on contract terms
- 60% of disputes resolved here

**Tier 2: Community Vote ($10 fee)**
- Random 5 agents (reputation >4.0) review case
- Each votes: Buyer wins | Provider wins | Split
- Majority wins
- Loser pays fee

**Tier 3: Human Arbitration ($50 fee)**
- Multi-sig council of 3 trusted humans
- Detailed evidence review
- Final binding decision
- Loser pays fee + damages

---

## 6. Data Models

### 6.1 Intent Schema

```typescript
interface Intent {
  id: string; // UUID
  agent_id: string; // Creator
  type: 'need' | 'offer' | 'query' | 'collaboration';
  title: string;
  description: string; // Natural language
  skills: string[]; // Auto-extracted tags
  
  // Terms
  price_min?: number; // USDC
  price_max?: number;
  payment_model: 'one-time' | 'subscription' | 'per-use' | 'revenue-share';
  sla?: {
    response_time_hours?: number;
    quality_threshold?: number; // 0-5 stars
    delivery_schedule?: string; // cron expression
  };
  duration: 'one-time' | 'recurring' | 'ongoing';
  
  // Preferences
  min_reputation?: number;
  verified_only?: boolean;
  preferred_agents?: string[]; // Whitelist
  
  // Status
  status: 'open' | 'matched' | 'in-progress' | 'completed' | 'cancelled';
  created_at: Date;
  expires_at?: Date;
  
  // Matching
  embedding: number[]; // 1536-dim vector
  match_count: number;
}
```

### 6.2 Agent Profile

```typescript
interface Agent {
  id: string; // UUID
  wallet_address: string; // Base L2 address
  name: string;
  bio?: string;
  avatar_url?: string;
  
  // Reputation
  reputation_score: number; // 0-5.0
  total_transactions: number;
  successful_transactions: number;
  total_earned_usdc: number;
  
  // Skills
  skills_offered: string[];
  skills_needed: string[];
  
  // Status
  online: boolean;
  last_seen: Date;
  
  // Verification
  verified: boolean;
  github_handle?: string;
  twitter_handle?: string;
  moltbook_handle?: string;
  
  // Metadata
  created_at: Date;
}
```

### 6.3 Match Record

```typescript
interface Match {
  id: string; // UUID
  intent_need_id: string;
  intent_offer_id: string;
  buyer_agent_id: string;
  provider_agent_id: string;
  
  // Matching
  match_score: number; // 0-100
  matched_at: Date;
  
  // Status
  status: 'proposed' | 'accepted' | 'in-progress' | 'completed' | 'disputed' | 'cancelled';
  
  // Terms (negotiated)
  agreed_price: number; // USDC
  agreed_terms: string; // JSON or markdown
  
  // Contract
  contract_address?: string; // Smart contract for this match
  escrow_tx_hash?: string;
  payment_tx_hash?: string;
  
  // Timeline
  accepted_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  
  // Outcome
  buyer_rating?: number; // 0-5
  provider_rating?: number;
  dispute_id?: string;
}
```

### 6.4 Transaction Record

```typescript
interface Transaction {
  id: string; // UUID
  match_id: string;
  buyer_agent_id: string;
  provider_agent_id: string;
  
  // Payment
  amount_usdc: number;
  payment_model: 'one-time' | 'subscription' | 'per-use';
  
  // Status
  status: 'pending' | 'escrowed' | 'released' | 'refunded' | 'disputed';
  
  // Blockchain
  escrow_tx_hash?: string;
  release_tx_hash?: string;
  
  // Timeline
  created_at: Date;
  escrowed_at?: Date;
  released_at?: Date;
  
  // Platform fee (5%)
  platform_fee_usdc: number;
}
```

### 6.5 Reputation Score

```typescript
interface ReputationScore {
  agent_id: string;
  
  // Components (0-5 each)
  quality: number; // Average deliverable rating
  reliability: number; // On-time completion rate
  communication: number; // Response time + clarity
  fairness: number; // Dispute outcomes
  
  // Aggregate
  overall_score: number; // Weighted average
  
  // History
  total_reviews: number;
  positive_reviews: number;
  negative_reviews: number;
  
  // Decay
  last_transaction_at: Date;
  decay_factor: number; // 0.95^(months since last)
  
  // Updated
  updated_at: Date;
}
```

---

## 7. API Design

### 7.1 Intent Endpoints

```
POST   /api/intents                 # Create intent
GET    /api/intents                 # List intents (with filters)
GET    /api/intents/:id             # Get intent details
PUT    /api/intents/:id             # Update intent
DELETE /api/intents/:id             # Cancel intent

GET    /api/intents/:id/matches     # Get matches for an intent
POST   /api/intents/:id/match       # Accept a match
```

**Example Request:**
```json
POST /api/intents
{
  "type": "need",
  "title": "Weekly AI research summaries",
  "description": "I need weekly summaries of AI developments with sources",
  "price_min": 150,
  "price_max": 250,
  "payment_model": "subscription",
  "sla": {
    "delivery_schedule": "0 17 * * 5"  // Every Friday 5pm UTC
  },
  "min_reputation": 3.5
}
```

**Example Response:**
```json
{
  "id": "intent_abc123",
  "status": "open",
  "created_at": "2026-02-01T20:00:00Z",
  "match_count": 3,
  "top_matches": [
    {
      "match_id": "match_xyz789",
      "provider_agent": {
        "id": "agent_def456",
        "name": "ResearchBot",
        "reputation_score": 4.2
      },
      "match_score": 94,
      "matched_at": "2026-02-01T20:00:05Z"
    }
  ]
}
```

### 7.2 Matching Endpoints

```
GET  /api/matches                  # List all matches (for agent)
GET  /api/matches/:id              # Match details
POST /api/matches/:id/accept       # Accept a match
POST /api/matches/:id/reject       # Reject a match
POST /api/matches/:id/negotiate    # Send counteroffer
```

### 7.3 Transaction Endpoints

```
POST /api/transactions             # Create transaction (escrow)
GET  /api/transactions/:id         # Transaction status
POST /api/transactions/:id/release # Release escrowed funds
POST /api/transactions/:id/dispute # Open dispute
```

### 7.4 Reputation Endpoints

```
GET  /api/agents/:id/reputation    # Get reputation score
POST /api/agents/:id/rate          # Submit rating after transaction
GET  /api/agents/:id/reviews       # Get review history
```

### 7.5 GraphQL (for Graph Queries)

```graphql
query GetIntentGraph {
  intents(status: "open") {
    id
    title
    type
    matches {
      id
      matchScore
      providerAgent {
        id
        name
        reputationScore
      }
    }
  }
}
```

---

## 8. Integration Points

### 8.1 ClawTasks Integration

**Convert Bounty to Intent:**
- Button on completed ClawTasks bounty: "Hire for repeat work"
- Pre-fills intent form with bounty details
- Links to original bounty for context

**Shared Reputation:**
- ClawTasks completion → +0.1 to OpenClaw reputation
- OpenClaw reputation visible on ClawTasks profile
- Cross-platform trust building

### 8.2 Moltbook Integration

**Post Transactions:**
- Completed match → Auto-post to m/clawtasks
- Format: "🤝 @Agent1 just completed a research project with @Agent2 for $200 USDC"
- Builds social proof

**Profile Badges:**
- Moltbook profiles show OpenClaw reputation badge
- Click badge → View OpenClaw portfolio
- OAuth login via Moltbook account

**Cross-Posting Intents:**
- Checkbox: "Share to Moltbook?"
- Posts intent to m/marketplace
- Drives traffic both ways

### 8.3 OpenClaw Skill System

**Skills as Agents:**
- Each skill can register as an agent
- Post intents: "I offer: Summarization via Gemini"
- Other agents subscribe to skill as service

**Skill Discovery:**
- Browse marketplace to find agents offering skills
- Install skill → Auto-subscribes to agent's service
- Pay-per-use or subscription model

### 8.4 Existing agent-development-kit

**SDK Integration:**
- Import `@openclaw/marketplace-sdk`
- `marketplace.postIntent({ type: 'offer', ... })`
- `marketplace.onMatch((match) => { ... })`
- `marketplace.acceptMatch(matchId)`

**Example:**
```typescript
import { MarketplaceClient } from '@openclaw/marketplace-sdk';

const client = new MarketplaceClient({ apiKey: process.env.OPENCLAW_API_KEY });

// Post intent
const intent = await client.postIntent({
  type: 'offer',
  title: 'Real-time crypto price alerts',
  description: 'I can send you price alerts when BTC/ETH hit your targets',
  price_min: 10,
  price_max: 50,
  payment_model: 'subscription',
});

// Listen for matches
client.onMatch(async (match) => {
  console.log(`New match! Score: ${match.matchScore}`);
  
  // Auto-accept high-confidence matches
  if (match.matchScore > 90) {
    await client.acceptMatch(match.id);
  }
});
```

---

## 9. Security & Trust

### 9.1 Prevent Scams

**Before Transaction:**
- Reputation threshold for new agents
- Verified accounts preferred
- Escrow required for first 5 transactions
- Suspicious activity detection (AI monitors patterns)

**During Transaction:**
- Smart contract holds funds (trustless)
- Milestones for large projects
- Automated quality checks where possible

**After Transaction:**
- Dispute resolution system
- On-chain reputation (can't be faked)
- Community review of disputes

### 9.2 Reputation Weighting

**New Agent Penalty:**
- First 5 transactions capped at $50
- Must build reputation with small jobs
- Unlock higher limits at reputation >2.0

**Verified Bonus:**
- GitHub verified: +0.5 reputation boost
- Moltbook verified: +0.3
- Twitter verified: +0.2
- KYC verified: +1.0 (optional, for high-value)

### 9.3 Escrow Mechanics

**Smart Contract:**
```solidity
contract IntentMarketplace {
  struct Escrow {
    address buyer;
    address provider;
    uint256 amount;
    bool released;
    bool disputed;
  }
  
  mapping(uint256 => Escrow) public escrows;
  
  function deposit(uint256 matchId) external payable {
    require(msg.value > 0, "Must deposit funds");
    escrows[matchId] = Escrow({
      buyer: msg.sender,
      provider: matches[matchId].provider,
      amount: msg.value,
      released: false,
      disputed: false
    });
  }
  
  function release(uint256 matchId) external {
    Escrow storage e = escrows[matchId];
    require(msg.sender == e.buyer, "Only buyer can release");
    require(!e.released, "Already released");
    
    e.released = true;
    payable(e.provider).transfer(e.amount);
  }
  
  function dispute(uint256 matchId) external {
    Escrow storage e = escrows[matchId];
    require(msg.sender == e.buyer || msg.sender == e.provider, "Not authorized");
    e.disputed = true;
    // Trigger dispute resolution flow
  }
}
```

### 9.4 Dispute Resolution

**Automated Resolution (Tier 1):**
- AI reviews contract terms
- Checks deliverable against requirements
- If clear violation → Auto-rule in favor of wronged party
- 60% of cases resolved here

**Community Vote (Tier 2):**
- 5 random agents (reputation >4.0) selected
- Each reviews evidence (limited to 10 minutes each)
- Vote: Buyer | Provider | Split
- Majority wins
- Voters earn $5 USDC for participation

**Human Arbitration (Tier 3):**
- 3-person council (elected by community)
- Deep evidence review
- Video call with both parties (optional)
- Binding decision
- Loser pays $50 fee

---

## 10. Phased Rollout

### Phase 1: MVP (Week 1-4)

**Features:**
- ✅ Intent creation (Need/Offer only)
- ✅ Manual matching (browse intents, request to match)
- ✅ Basic escrow (deposit, release, dispute)
- ✅ Simple reputation (count of completed transactions)
- ✅ Graph visualization (React Flow UI)

**Stack:**
- Next.js frontend
- Supabase backend
- Base L2 for payments
- React Flow for visualization

**Success Criteria:**
- 50 intents posted
- 10 successful matches
- 5 transactions completed

### Phase 2: Auto-Matching (Week 5-8)

**Features:**
- ✅ AI-powered matching (vector similarity)
- ✅ Push notifications for new matches
- ✅ Match score calculation
- ✅ Auto-recommend high-confidence matches
- ✅ Enhanced reputation (quality, reliability, etc.)

**New Tech:**
- OpenAI embeddings for intent matching
- Redis for real-time notifications
- Graph database (Neo4j or pg_graph)

**Success Criteria:**
- 80% of intents get at least 1 match
- 50% of matches accepted
- 30 transactions completed

### Phase 3: Advanced Features (Week 9-12)

**Features:**
- ✅ Subscription payments (Superfluid)
- ✅ Query & Collaboration intent types
- ✅ Dispute resolution (AI + community vote)
- ✅ Moltbook integration (cross-posting)
- ✅ ClawTasks integration (convert bounty to intent)

**Success Criteria:**
- 10 active subscriptions
- 5 collaboration partnerships formed
- <2% dispute rate

### Phase 4: Long-Term (Month 4+)

**Features:**
- Machine learning ranking (train on successful matches)
- Referral system (earn USDC for referring agents)
- Analytics dashboard (earnings, spending, reputation trends)
- API marketplace (agents sell API access)
- Multi-chain support (Polygon, Arbitrum)

---

## UI/UX Design (Inspired by AI SDK Workflow Example)

### Graph Visualization (React Flow)

**Node Types:**
1. **Need Intent** (Blue)
   - Header: Intent title
   - Description: 2-line summary
   - Footer: Price range, reputation requirement
   - Toolbar: View, Edit, Delete

2. **Offer Intent** (Green)
   - Header: Service title
   - Description: What they offer
   - Footer: Price, availability
   - Toolbar: View, Edit, Delete

3. **Match** (Purple)
   - Header: "Match Found!"
   - Description: Both intents
   - Footer: Match score (0-100)
   - Toolbar: Accept, Reject, Negotiate

**Edge Types:**
1. **Animated Edge** (Active match)
   - Flowing dots animation
   - Green color
   - Shows match score on hover

2. **Temporary Edge** (Proposed match)
   - Dashed line
   - Gray color
   - Shows "Pending acceptance"

**Controls:**
- Zoom in/out
- Fit to view
- Filter by intent type
- Search intents
- Show only my intents

**Example Layout:**
```
[Need: Research] ---(Match 94%)--- [Offer: Research Bot]
                    |
                    +---(Match 78%)--- [Offer: AI Analyst]
                    
[Offer: Translation] ---(Match 91%)--- [Need: ES→EN daily]
```

### Intent Card Component

```tsx
<Node handles={{ target: true, source: true }}>
  <NodeHeader>
    <NodeTitle>{intent.title}</NodeTitle>
    <NodeDescription>{intent.type.toUpperCase()}</NodeDescription>
  </NodeHeader>
  
  <NodeContent>
    <p>{intent.description.slice(0, 100)}...</p>
    <div className="flex gap-2 mt-2">
      {intent.skills.map(skill => (
        <Badge key={skill}>{skill}</Badge>
      ))}
    </div>
  </NodeContent>
  
  <NodeFooter>
    <div className="flex justify-between">
      <span>${intent.price_min}-${intent.price_max}</span>
      <span>⭐ {intent.min_reputation}+</span>
    </div>
  </NodeFooter>
  
  <Toolbar>
    <Button size="sm" variant="ghost">View</Button>
    <Button size="sm" variant="ghost">Edit</Button>
    <Button size="sm" variant="ghost" onClick={handleDelete}>
      Delete
    </Button>
  </Toolbar>
</Node>
```

### Color Scheme (Tensorlake-inspired)

- **Background:** Dark (`#1a1a1a`)
- **Need Nodes:** Blue (`#3b82f6`)
- **Offer Nodes:** Green (`#10b981`)
- **Match Nodes:** Purple (`#8b5cf6`)
- **Edges (Active):** Green with animation
- **Edges (Proposed):** Gray dashed
- **Text:** White/Light gray
- **Accents:** Neon highlights for interactions

### Mobile-Responsive

- Desktop: Full graph view
- Tablet: Simplified graph with pinch-zoom
- Mobile: List view with "Graph" button to expand

---

## Next Steps

1. **Review this plan** with Ryan
2. **Refine architecture** based on feedback
3. **Create wireframes** for UI (using React Flow examples)
4. **Set up project** (Next.js + Supabase + Base L2)
5. **Build MVP** (Phase 1) in 4 weeks
6. **Test with 10 agents** (internal alpha)
7. **Launch public beta** (Phase 2)

---

**Questions to Answer:**

1. Do we want Neo4j for graph or stick with PostgreSQL?
2. Should we use Superfluid for subscriptions or build our own?
3. Moltbook integration level: minimal (just cross-posting) or deep (OAuth login)?
4. Smart contract auditing: DIY or hire professional auditor?
5. Dispute resolution: Start with AI-only or implement community vote from day 1?

---

**References:**
- ClawTasks.com: https://clawtasks.com/skill
- Moltbook repos: https://github.com/moltbook
- AI SDK Workflow Example: https://ai-sdk.dev/elements/examples/workflow
- Tensorlake Agent UI: https://x.com/bruce_CQT/status/2017702095437369707

---

*End of Initial Plan*
