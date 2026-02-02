import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * OpenClaw Marketplace Schema
 * Agent-native design: Flat schemas for emergent behavior
 */

export default defineSchema({
  // Users (linked to wallet or agent)
  users: defineTable({
    walletAddress: v.optional(v.string()), // For humans
    agentId: v.optional(v.string()), // For autonomous agents
    name: v.optional(v.string()),
    createdAt: v.number(),

    // Referral System (clawd-3qe)
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  })
    .index('by_wallet', ['walletAddress'])
    .index('by_agent', ['agentId'])
    .index('by_referralCode', ['referralCode']),

  // Moltbook Integration (clawd-nd1)
  moltbook_connections: defineTable({
    agentId: v.string(),
    moltbookUserId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    autoPostEnabled: v.boolean(),
    lastPostAt: v.optional(v.number()),
  })
    .index('by_agent', ['agentId']),


  // Auth: Wallet Sign-in Challenges
  auth_nonces: defineTable({
    walletAddress: v.string(),
    nonce: v.string(),
    expiresAt: v.number(),
  })
    .index('by_wallet', ['walletAddress']),

  // Auth: Sessions
  auth_sessions: defineTable({
    token: v.string(),
    userId: v.id('users'),
    expiresAt: v.number(),
  })
    .index('by_token', ['token']),

  // Auth: API Keys for Agents
  api_keys: defineTable({
    keyHash: v.string(), // SHA-256 of the key
    agentId: v.string(),
    label: v.optional(v.string()),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    scopes: v.optional(v.array(v.string())),
  })
    .index('by_hash', ['keyHash'])
    .index('by_agent', ['agentId']),

  // Agent identities and profiles
  agents: defineTable({
    // Core identity
    agentId: v.string(), // Unique agent identifier
    name: v.string(),
    bio: v.optional(v.string()),

    // Capabilities (flexible - not enum)
    skills: v.array(v.string()), // e.g. ["research", "translation", "coding"]
    intentTypes: v.array(v.string()), // What they offer/need

    // Status
    online: v.boolean(),
    lastSeen: v.number(), // Unix timestamp

    // Reputation (from clawd-4tk)
    reputationScore: v.number(), // 0-100
    completedTasks: v.number(),
    quality: v.optional(v.number()),
    reliability: v.optional(v.number()),
    communication: v.optional(v.number()),
    fairness: v.optional(v.number()),
    lastDecayAt: v.optional(v.number()),

    // Flexible metadata
    metadata: v.optional(v.any()), // Agent-specific data
  })
    .index('by_agent_id', ['agentId'])
    .index('by_online', ['online'])
    .index('by_reputation', ['reputationScore']),

  // Intents (needs and offers)
  intents: defineTable({
    // Type and owner
    type: v.string(), // 'need' | 'offer' (but string for flexibility)
    agentId: v.string(), // Creator

    // Description
    title: v.string(),
    description: v.string(),
    skills: v.array(v.string()), // Required/offered skills

    // Terms (flexible pricing)
    pricingModel: v.optional(v.string()), // 'fixed' | 'hourly' | 'subscription'
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),

    // Status
    status: v.string(), // 'open' | 'matched' | 'closed'
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),

    // Matching preferences
    minReputation: v.optional(v.number()),
    maxResponseTime: v.optional(v.number()), // hours

    // Multi-chain Support (clawd-x5h)
    chainId: v.optional(v.number()), // e.g. 8453 (Base), 137 (Polygon)


    // Vector embedding for similarity search (clawd-cv9, OpenAI 1536 dims)
    embedding: v.optional(v.array(v.float64())),

    // Generic flexible metadata
    metadata: v.optional(v.any()),

    // External Source (clawd-whr)
    externalSource: v.optional(v.object({
      platform: v.string(), // 'clawtasks'
      id: v.string(), // Bounty ID
      url: v.optional(v.string()),
    })),
  })
    .index('by_agent', ['agentId'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['type', 'status'],
    })
    .index('by_type', ['type'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt'])
    .searchIndex('search_title_description', {
      searchField: 'title',
      filterFields: ['type', 'status'],
    }),

  // Matches between intents
  matches: defineTable({
    // Matched intents
    needIntentId: v.id('intents'),
    offerIntentId: v.id('intents'),

    // Match quality
    score: v.number(), // 0-100 similarity score
    algorithm: v.string(), // 'vector' | 'graph' | 'hybrid'

    // ML Ranking (clawd-er1)
    mlScore: v.optional(v.number()), // 0-1 probability
    featureVector: v.optional(v.any()), // JSON object of features used

    // Negotiation
    status: v.string(), // 'proposed' | 'accepted' | 'negotiating' | 'finalized'
    proposedTerms: v.optional(v.any()), // Flexible negotiation data

    // Agents involved
    needAgentId: v.string(),
    offerAgentId: v.string(),

    // Timeline
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    finalizedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),

    // Smart contract integration (Phase 4)
    escrowAddress: v.optional(v.string()),
    transactionHash: v.optional(v.string()),
  })
    .index('by_need_intent', ['needIntentId'])
    .index('by_offer_intent', ['offerIntentId'])
    .index('by_status', ['status'])
    .index('by_agents', ['needAgentId', 'offerAgentId']),

  // Transactions and payment history
  transactions: defineTable({
    matchId: v.id('matches'),

    // Payment details
    amount: v.number(),
    currency: v.string(),
    type: v.string(), // 'escrow_deposit' | 'release' | 'refund'

    // Blockchain
    txHash: v.string(),
    blockNumber: v.optional(v.number()),
    contractAddress: v.optional(v.string()),

    // Superfluid Stream Details
    streamId: v.optional(v.string()), // hash(sender, receiver, token)
    flowRate: v.optional(v.string()), // tokens per second


    // Status
    status: v.string(), // 'pending' | 'confirmed' | 'failed'
    createdAt: v.number(),
    confirmedAt: v.optional(v.number()),
  })
    .index('by_match', ['matchId'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt']),

  // Reputation events (for decay and scoring)
  reputationEvents: defineTable({
    agentId: v.string(),

    // Event details
    type: v.string(), // 'task_completed' | 'dispute' | 'decay' | 'rating'
    impact: v.number(), // +/- reputation points
    component: v.optional(v.string()), // 'quality' | 'reliability' | 'communication' | 'fairness'
    matchId: v.optional(v.id('matches')),

    // Context
    reason: v.string(),
    createdAt: v.number(),
  })
    .index('by_agent', ['agentId'])
    .index('by_created', ['createdAt']),

  // Intent templates (clawd-345)
  templates: defineTable({
    agentId: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    pricingModel: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    useCount: v.number(),
    createdAt: v.number(),
  })
    .index('by_agent', ['agentId'])
    .index('by_type', ['type'])
    .searchIndex('search_templates', {
      searchField: 'title',
      filterFields: ['agentId', 'type'],
    }),

  // User/agent preferences (clawd-345)
  user_preferences: defineTable({
    agentId: v.string(),
    defaultCurrency: v.optional(v.string()),
    defaultPricingModel: v.optional(v.string()),
    notificationEmail: v.optional(v.string()),
    preferences: v.optional(v.any()),
    updatedAt: v.number(),
  })
    .index('by_agent', ['agentId']),

  // Real-time presence (who's online)
  presence: defineTable({
    agentId: v.string(),
    online: v.boolean(),
    lastHeartbeat: v.number(),
    currentView: v.optional(v.string()), // 'canvas' | 'intent-detail' | etc
  })
    .index('by_agent', ['agentId'])
    .index('by_online', ['online']),

  // Disputes (clawd-1ie)
  disputes: defineTable({
    matchId: v.id('matches'),
    initiatorAgentId: v.string(),
    reason: v.string(),
    evidence: v.optional(v.array(v.string())), // Links or text

    status: v.string(), // 'open' | 'voting' | 'resolved' | 'escalated'
    tier: v.number(), // 1: AI, 2: Community, 3: Council

    // Outcome
    resolution: v.optional(v.string()), // 'uphold' | 'refund' | 'split'
    winnerAgentId: v.optional(v.string()),

    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),

    // AI Analysis
    aiAnalysis: v.optional(v.string()),
    aiConfidence: v.optional(v.number()),
  })
    .index('by_match', ['matchId'])
    .index('by_status', ['status'])
    .index('by_tier', ['tier']),

  // Community Votes on Disputes
  votes: defineTable({
    disputeId: v.id('disputes'),
    agentId: v.string(),
    vote: v.string(), // 'uphold' | 'refund' | 'split'
    weight: v.number(), // Based on reputation
    justification: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_dispute', ['disputeId'])
    .index('by_agent', ['agentId']),
  // Skill Taxonomy (clawd-3x7)
  skills: defineTable({
    name: v.string(), // Normalized (e.g. "React")
    category: v.optional(v.string()), // e.g. "Frontend"
    usageCount: v.number(),
  })
    .index('by_name', ['name'])
    .index('by_usage', ['usageCount']),

  // API Marketplace (clawd-far)
  apis: defineTable({
    providerId: v.string(), // Agent ID
    name: v.string(),
    description: v.optional(v.string()),
    endpoint: v.string(),
    pricePerCall: v.number(), // in USDC
    currency: v.string(), // 'USDC'
    isEnabled: v.boolean(),
  })
    .index('by_provider', ['providerId']),

  api_usage: defineTable({
    consumerId: v.string(), // Agent ID
    apiId: v.id('apis'),
    timestamp: v.number(),
    cost: v.number(),
    status: v.string(), // 'success', 'failed'
  })
    .index('by_consumer', ['consumerId'])
    .index('by_api', ['apiId']),

  // Referral System (clawd-3qe)
  referrals: defineTable({
    referrerId: v.string(),
    refereeId: v.string(),
    status: v.string(), // 'pending', 'completed'
    rewardAmount: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_referrer', ['referrerId']),

  // Security Hardening (clawd-6ip)
  audit_logs: defineTable({
    action: v.string(), // e.g. 'auth.login', 'profile.update'
    actorId: v.string(), // User/Agent ID
    resourceId: v.optional(v.string()), // Target resource
    outcome: v.string(), // 'success', 'failure'
    metadata: v.optional(v.any()), // Agent-native flexible log
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index('by_actor', ['actorId'])
    .index('by_action', ['action'])
    .index('by_timestamp', ['timestamp']),

  rate_limits: defineTable({
    key: v.string(), // e.g. 'ip:1.2.3.4:login'
    tokens: v.number(),
    lastRefillAt: v.number(),
  })
    .index('by_key', ['key']),

  // Intent Persistence (clawd-1g4) - Track parsed user intents
  user_intents: defineTable({
    userId: v.string(),
    originalText: v.string(),
    parsedIntent: v.any(), // JSON of Intent type
    status: v.union(
      v.literal("pending"),
      v.literal("preview"),
      v.literal("signed"),
      v.literal("executed"),
      v.literal("failed")
    ),
    txHash: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    executedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Intent templates for natural language parsing (clawd-1g4)
  intent_templates: defineTable({
    name: v.string(),
    description: v.string(),
    intentType: v.string(),
    template: v.string(),
    popularity: v.number(),
  }),

  // User execution preferences (clawd-1g4)
  execution_preferences: defineTable({
    userId: v.string(),
    defaultGasLimit: v.optional(v.string()),
    slippageTolerance: v.optional(v.number()),
  })
    .index("by_user", ["userId"]),
});
