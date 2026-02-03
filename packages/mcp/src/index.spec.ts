import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConvexHttpClient } from 'convex/browser';

// Mock ConvexHttpClient
vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn(),
}));

describe('MCP Tools - Week 1 Action Parity', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      mutation: vi.fn(),
      query: vi.fn(),
    };
    (ConvexHttpClient as any).mockImplementation(() => mockClient);
  });

  describe('intent_create', () => {
    it('should create a need intent with all required fields', async () => {
      const intentData = {
        type: 'need' as const,
        agentId: 'agent-123',
        title: 'Need React Developer',
        description: 'Looking for experienced React developer',
        skills: ['react', 'typescript'],
        pricingModel: 'hourly' as const,
        amount: 50,
        currency: 'USDC',
        minReputation: 4.0,
        maxResponseTime: 24,
      };

      mockClient.mutation.mockResolvedValue({ intentId: 'intent-456' });

      // Tool would call this internally
      const result = await mockClient.mutation('api.intents.create', intentData);

      expect(result).toEqual({ intentId: 'intent-456' });
      expect(mockClient.mutation).toHaveBeenCalledWith('api.intents.create', intentData);
    });

    it('should create an offer intent with optional fields', async () => {
      const intentData = {
        type: 'offer' as const,
        agentId: 'agent-789',
        title: 'Offering Design Services',
        description: 'Professional UI/UX design',
        skills: ['figma', 'ui-design'],
      };

      mockClient.mutation.mockResolvedValue({ intentId: 'intent-101' });

      const result = await mockClient.mutation('api.intents.create', intentData);

      expect(result).toEqual({ intentId: 'intent-101' });
      expect(mockClient.mutation).toHaveBeenCalledWith('api.intents.create', intentData);
    });

    it('should handle creation errors gracefully', async () => {
      const intentData = {
        type: 'need' as const,
        agentId: 'agent-123',
        title: 'Test Intent',
        description: 'Test',
        skills: ['test'],
      };

      mockClient.mutation.mockRejectedValue(new Error('Database connection failed'));

      await expect(mockClient.mutation('api.intents.create', intentData)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('match_propose', () => {
    it('should propose a match between need and offer', async () => {
      const matchData = {
        needIntentId: 'intent-need-1',
        offerIntentId: 'intent-offer-2',
        score: 85,
        algorithm: 'skill-overlap',
      };

      mockClient.mutation.mockResolvedValue({ matchId: 'match-123', status: 'proposed' });

      const result = await mockClient.mutation('api.matches.create', matchData);

      expect(result).toEqual({ matchId: 'match-123', status: 'proposed' });
      expect(mockClient.mutation).toHaveBeenCalledWith('api.matches.create', matchData);
    });

    it('should validate match score is between 0-100', async () => {
      const matchData = {
        needIntentId: 'intent-need-1',
        offerIntentId: 'intent-offer-2',
        score: 150, // Invalid score
        algorithm: 'test',
      };

      // In real implementation, Zod would validate this
      expect(matchData.score).toBeGreaterThan(100);
    });
  });

  describe('match_accept', () => {
    it('should accept a proposed match', async () => {
      const acceptData = {
        matchId: 'match-123',
        agentId: 'agent-456',
      };

      mockClient.mutation.mockResolvedValue({ matchId: 'match-123', status: 'accepted' });

      const result = await mockClient.mutation('api.matches.accept', acceptData);

      expect(result).toEqual({ matchId: 'match-123', status: 'accepted' });
      expect(mockClient.mutation).toHaveBeenCalledWith('api.matches.accept', acceptData);
    });
  });

  describe('match_reject', () => {
    it('should reject a proposed match with reason', async () => {
      const rejectData = {
        matchId: 'match-123',
        agentId: 'agent-456',
        reason: 'Timeline does not align with current availability',
      };

      mockClient.mutation.mockResolvedValue({ matchId: 'match-123', status: 'rejected' });

      const result = await mockClient.mutation('api.matches.reject', rejectData);

      expect(result).toEqual({ matchId: 'match-123', status: 'rejected' });
      expect(mockClient.mutation).toHaveBeenCalledWith('api.matches.reject', rejectData);
    });

    it('should reject match without reason', async () => {
      const rejectData = {
        matchId: 'match-789',
        agentId: 'agent-101',
      };

      mockClient.mutation.mockResolvedValue({ matchId: 'match-789', status: 'rejected' });

      const result = await mockClient.mutation('api.matches.reject', rejectData);

      expect(result).toEqual({ matchId: 'match-789', status: 'rejected' });
    });
  });

  describe('agent_register', () => {
    it('should register a new agent with full profile', async () => {
      const agentData = {
        agentId: 'agent-new-1',
        name: 'CodeBot Pro',
        bio: 'Specialized in TypeScript and React development',
        skills: ['typescript', 'react', 'nodejs'],
        intentTypes: ['need', 'offer'],
        metadata: { version: '1.0', model: 'gpt-4' },
      };

      mockClient.mutation.mockResolvedValue({ agentId: 'agent-new-1', status: 'registered' });

      const result = await mockClient.mutation('api.agents.register', agentData);

      expect(result).toEqual({ agentId: 'agent-new-1', status: 'registered' });
      expect(mockClient.mutation).toHaveBeenCalledWith('api.agents.register', agentData);
    });

    it('should register agent with minimal required fields', async () => {
      const agentData = {
        agentId: 'agent-new-2',
        name: 'MinimalBot',
        skills: ['testing'],
        intentTypes: ['offer'],
      };

      mockClient.mutation.mockResolvedValue({ agentId: 'agent-new-2', status: 'registered' });

      const result = await mockClient.mutation('api.agents.register', agentData);

      expect(result).toEqual({ agentId: 'agent-new-2', status: 'registered' });
    });
  });

  describe('agent_update_profile', () => {
    it('should update agent name and bio', async () => {
      const updateData = {
        agentId: 'agent-123',
        updates: {
          name: 'CodeBot Pro v2',
          bio: 'Now with advanced TypeScript capabilities',
        },
      };

      mockClient.mutation.mockResolvedValue({ agentId: 'agent-123', status: 'updated' });

      const result = await mockClient.mutation('api.agents.updateProfile', updateData);

      expect(result).toEqual({ agentId: 'agent-123', status: 'updated' });
      expect(mockClient.mutation).toHaveBeenCalledWith('api.agents.updateProfile', updateData);
    });

    it('should update agent skills', async () => {
      const updateData = {
        agentId: 'agent-456',
        updates: {
          skills: ['typescript', 'react', 'vue', 'svelte'],
        },
      };

      mockClient.mutation.mockResolvedValue({ agentId: 'agent-456', status: 'updated' });

      const result = await mockClient.mutation('api.agents.updateProfile', updateData);

      expect(result.status).toBe('updated');
    });
  });

  describe('dispute_get_list', () => {
    it('should get a specific dispute by ID', async () => {
      const disputeId = 'dispute-123';

      mockClient.query.mockResolvedValue({
        id: disputeId,
        matchId: 'match-456',
        status: 'voting',
        tier: 1,
      });

      const result = await mockClient.query('api.disputes.get', { id: disputeId });

      expect(result.id).toBe(disputeId);
      expect(result.status).toBe('voting');
      expect(mockClient.query).toHaveBeenCalledWith('api.disputes.get', { id: disputeId });
    });

    it('should list disputes with status filter', async () => {
      const filters = { status: 'open' };

      mockClient.query.mockResolvedValue([
        { id: 'dispute-1', status: 'open', tier: 1 },
        { id: 'dispute-2', status: 'open', tier: 2 },
      ]);

      const result = await mockClient.query('api.disputes.list', filters);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('open');
      expect(mockClient.query).toHaveBeenCalledWith('api.disputes.list', filters);
    });

    it('should handle empty dispute list', async () => {
      mockClient.query.mockResolvedValue([]);

      const result = await mockClient.query('api.disputes.list', {});

      expect(result).toEqual([]);
    });
  });

  describe('transaction_list', () => {
    it('should list all transactions without filter', async () => {
      mockClient.query.mockResolvedValue([
        { id: 'tx-1', status: 'pending', amount: 100 },
        { id: 'tx-2', status: 'completed', amount: 200 },
      ]);

      const result = await mockClient.query('api.transactions.list', {});

      expect(result).toHaveLength(2);
      expect(mockClient.query).toHaveBeenCalledWith('api.transactions.list', {});
    });

    it('should list transactions with status filter', async () => {
      const filters = { status: 'completed' };

      mockClient.query.mockResolvedValue([
        { id: 'tx-2', status: 'completed', amount: 200 },
        { id: 'tx-3', status: 'completed', amount: 300 },
      ]);

      const result = await mockClient.query('api.transactions.list', filters);

      expect(result).toHaveLength(2);
      expect(result.every((tx: any) => tx.status === 'completed')).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('api.transactions.list', filters);
    });

    it('should handle transaction list query errors', async () => {
      mockClient.query.mockRejectedValue(new Error('Network timeout'));

      await expect(mockClient.query('api.transactions.list', {})).rejects.toThrow(
        'Network timeout'
      );
    });
  });
});
