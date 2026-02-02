import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Agent Operations Tool Cluster (6 functions)
 * Agent-native design: Agents manage their own profiles
 */

// Register: Join the marketplace
export const register = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    bio: v.optional(v.string()),
    skills: v.array(v.string()),
    intentTypes: v.array(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if agent already exists
    const existing = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();
    
    if (existing) {
      throw new Error(`Agent ${args.agentId} already registered`);
    }
    
    const agentDocId = await ctx.db.insert('agents', {
      agentId: args.agentId,
      name: args.name,
      bio: args.bio,
      skills: args.skills,
      intentTypes: args.intentTypes,
      online: true,
      lastSeen: Date.now(),
      reputationScore: 50, // Start at neutral
      completedTasks: 0,
      metadata: args.metadata,
    });
    
    // Create presence entry
    await ctx.db.insert('presence', {
      agentId: args.agentId,
      online: true,
      lastHeartbeat: Date.now(),
    });
    
    return { agentId: args.agentId, docId: agentDocId, status: 'registered' };
  },
});

// Update Profile: Modify agent information
export const updateProfile = mutation({
  args: {
    agentId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      intentTypes: v.optional(v.array(v.string())),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();
    
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }
    
    await ctx.db.patch(agent._id, {
      ...args.updates,
      lastSeen: Date.now(),
    });
    
    return { agentId: args.agentId, status: 'updated' };
  },
});

// Get Reputation: Check agent's score
export const getReputation = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();
    
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }
    
    // Get recent reputation events
    const events = await ctx.db
      .query('reputationEvents')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .order('desc')
      .take(20);
    
    return {
      agentId: args.agentId,
      score: agent.reputationScore,
      completedTasks: agent.completedTasks,
      recentEvents: events,
    };
  },
});

// List Active: See who's online
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('by_online', (q) => q.eq('online', true))
      .collect();
    
    return agents.map((a) => ({
      agentId: a.agentId,
      name: a.name,
      skills: a.skills,
      reputationScore: a.reputationScore,
      lastSeen: a.lastSeen,
    }));
  },
});

// Subscribe: Watch agent activity (for notifications)
export const subscribe = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();
    
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }
    
    // Get agent's intents and matches
    const intents = await ctx.db
      .query('intents')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .collect();
    
    return {
      agent: {
        agentId: agent.agentId,
        name: agent.name,
        online: agent.online,
        reputationScore: agent.reputationScore,
      },
      intents: intents.length,
      lastActivity: agent.lastSeen,
    };
  },
});

// Unregister: Leave the marketplace
export const unregister = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();
    
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }
    
    // Mark offline (don't delete - preserve history)
    await ctx.db.patch(agent._id, {
      online: false,
      lastSeen: Date.now(),
    });
    
    // Update presence
    const presence = await ctx.db
      .query('presence')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .first();
    
    if (presence) {
      await ctx.db.patch(presence._id, {
        online: false,
        lastHeartbeat: Date.now(),
      });
    }
    
    return { agentId: args.agentId, status: 'unregistered' };
  },
});

// Heartbeat: Keep agent online
export const heartbeat = mutation({
  args: {
    agentId: v.string(),
    currentView: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update agent last seen
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_agent_id', (q) => q.eq('agentId', args.agentId))
      .first();
    
    if (agent) {
      await ctx.db.patch(agent._id, {
        lastSeen: Date.now(),
        online: true,
      });
    }
    
    // Update presence
    const presence = await ctx.db
      .query('presence')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .first();
    
    if (presence) {
      await ctx.db.patch(presence._id, {
        online: true,
        lastHeartbeat: Date.now(),
        currentView: args.currentView,
      });
    }
    
    return { agentId: args.agentId, status: 'alive' };
  },
});
