import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

describe('Week 1 CRUD Mutations', () => {
  describe('Transactions CRUD', () => {
    it('should create a transaction with pending status', async () => {
      const t = convexTest(schema, modules);
      
      // Create a match first
      const matchId = await t.run(async (ctx) => {
        const needIntentId = await ctx.db.insert('intents', {
          type: 'need',
          agentId: 'agent-1',
          title: 'Test Need',
          description: 'Test',
          skills: ['skill-1'],
          status: 'open',
          createdAt: Date.now(),
        });
        const offerIntentId = await ctx.db.insert('intents', {
          type: 'offer',
          agentId: 'agent-2',
          title: 'Test Offer',
          description: 'Test',
          skills: ['skill-1'],
          status: 'open',
          createdAt: Date.now(),
        });
        return await ctx.db.insert('matches', {
          needIntentId,
          offerIntentId,
          needAgentId: 'agent-1',
          offerAgentId: 'agent-2',
          score: 85,
          algorithm: 'test',
          status: 'proposed',
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000,
        });
      });

      const result = await t.mutation(api.transactions.create, {
        matchId,
        amount: 100,
        currency: 'USDC',
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
      });

      expect(result.status).toBe('created');
      expect(result.transactionId).toBeDefined();

      const tx = await t.run(async (ctx) => {
        return await ctx.db.get(result.transactionId);
      });

      expect(tx?.status).toBe('pending');
      expect(tx?.amount).toBe(100);
    });

    it('should update transaction status', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, {
        type: 'need',
        agentId: 'agent-1',
        title: 'N',
        description: 'D',
        skills: ['s'],
      });
      const offer = await t.mutation(api.intents.create, {
        type: 'offer',
        agentId: 'agent-2',
        title: 'O',
        description: 'D',
        skills: ['s'],
      });
      const { matchId } = await t.mutation(api.matches.create, {
        needIntentId: need.intentId,
        offerIntentId: offer.intentId,
        score: 85,
        algorithm: 'test',
      });
      const { transactionId: txId } = await t.mutation(api.transactions.create, {
        matchId,
        amount: 100,
        currency: 'USDC',
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
      });

      await t.mutation(api.transactions.updateStatus, {
        transactionId: txId,
        status: 'confirmed',
        txHash: '0xabc123',
      });

      const tx = await t.run(async (ctx) => await ctx.db.get(txId));
      expect(tx?.status).toBe('confirmed');
      expect(tx?.txHash).toBe('0xabc123');
    });

    it('should cancel pending transaction', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, {
        type: 'need',
        agentId: 'agent-1',
        title: 'N',
        description: 'D',
        skills: ['s'],
      });
      const offer = await t.mutation(api.intents.create, {
        type: 'offer',
        agentId: 'agent-2',
        title: 'O',
        description: 'D',
        skills: ['s'],
      });
      const { matchId } = await t.mutation(api.matches.create, {
        needIntentId: need.intentId,
        offerIntentId: offer.intentId,
        score: 85,
        algorithm: 'test',
      });
      const { transactionId: txId } = await t.mutation(api.transactions.create, {
        matchId,
        amount: 100,
        currency: 'USDC',
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
      });

      await t.mutation(api.transactions.cancel, { transactionId: txId });

      const tx = await t.run(async (ctx) => await ctx.db.get(txId));
      expect(tx).toBeNull();
    });
  });

  describe('Disputes CRUD', () => {
    it('should get dispute by id', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, { type: 'need', agentId: 'agent-1', title: 'N', description: 'D', skills: ['s'] });
      const offer = await t.mutation(api.intents.create, { type: 'offer', agentId: 'agent-2', title: 'O', description: 'D', skills: ['s'] });
      const { matchId } = await t.mutation(api.matches.create, { needIntentId: need.intentId, offerIntentId: offer.intentId, score: 85, algorithm: 'test' });
      const disputeId = await t.run(async (ctx) => {
        return await ctx.db.insert('disputes', {
          matchId,
          initiatorAgentId: 'agent-1',
          reason: 'Test dispute',
          evidence: ['Evidence 1'],
          status: 'open',
          tier: 1,
          createdAt: Date.now(),
        });
      });

      const dispute = await t.query(api.disputes.get, { id: disputeId });
      expect(dispute.reason).toBe('Test dispute');
      expect(dispute.status).toBe('open');
    });

    it('should list disputes with filters', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, { type: 'need', agentId: 'agent-1', title: 'N', description: 'D', skills: ['s'] });
      const offer = await t.mutation(api.intents.create, { type: 'offer', agentId: 'agent-2', title: 'O', description: 'D', skills: ['s'] });
      const { matchId } = await t.mutation(api.matches.create, { needIntentId: need.intentId, offerIntentId: offer.intentId, score: 85, algorithm: 'test' });
      await t.run(async (ctx) => {
        await ctx.db.insert('disputes', {
          matchId,
          initiatorAgentId: 'agent-1',
          reason: 'Dispute 1',
          evidence: ['Evidence'],
          status: 'open',
          tier: 1,
          createdAt: Date.now(),
        });
        await ctx.db.insert('disputes', {
          matchId,
          initiatorAgentId: 'agent-2',
          reason: 'Dispute 2',
          evidence: ['Evidence'],
          status: 'voting',
          tier: 2,
          createdAt: Date.now(),
        });
      });

      const openDisputes = await t.query(api.disputes.list, { status: 'open' });
      expect(openDisputes.length).toBeGreaterThanOrEqual(1);
      expect(openDisputes.some((d) => d.status === 'open')).toBe(true);

      const agent1Disputes = await t.query(api.disputes.list, { agentId: 'agent-1' });
      expect(agent1Disputes.length).toBeGreaterThanOrEqual(1);
    });

    it('should remove dispute', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, { type: 'need', agentId: 'agent-1', title: 'N', description: 'D', skills: ['s'] });
      const offer = await t.mutation(api.intents.create, { type: 'offer', agentId: 'agent-2', title: 'O', description: 'D', skills: ['s'] });
      const { matchId } = await t.mutation(api.matches.create, { needIntentId: need.intentId, offerIntentId: offer.intentId, score: 85, algorithm: 'test' });
      const disputeId = await t.run(async (ctx) => {
        return await ctx.db.insert('disputes', {
          matchId,
          initiatorAgentId: 'agent-1',
          reason: 'Test',
          evidence: ['Evidence'],
          status: 'open',
          tier: 1,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.disputes.remove, { disputeId });

      const dispute = await t.run(async (ctx) => await ctx.db.get(disputeId));
      expect(dispute).toBeNull();
    });
  });

  describe('Votes CRUD', () => {
    it('should get vote by id', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, { type: 'need', agentId: 'agent-1', title: 'N', description: 'D', skills: ['s'] });
      const offer = await t.mutation(api.intents.create, { type: 'offer', agentId: 'agent-2', title: 'O', description: 'D', skills: ['s'] });
      const { matchId } = await t.mutation(api.matches.create, { needIntentId: need.intentId, offerIntentId: offer.intentId, score: 85, algorithm: 'test' });
      const voteId = await t.run(async (ctx) => {
        const disputeId = await ctx.db.insert('disputes', {
          matchId,
          initiatorAgentId: 'agent-1',
          reason: 'Test',
          evidence: ['Evidence'],
          status: 'voting',
          tier: 2,
          createdAt: Date.now(),
        });
        return await ctx.db.insert('votes', {
          disputeId,
          agentId: 'agent-1',
          vote: 'uphold',
          weight: 75,
          createdAt: Date.now(),
        });
      });

      const vote = await t.query(api.votes.get, { id: voteId });
      expect(vote.vote).toBe('uphold');
      expect(vote.weight).toBe(75);
    });

    it('should list votes with filters', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, { type: 'need', agentId: 'agent-1', title: 'N', description: 'D', skills: ['s'] });
      const offer = await t.mutation(api.intents.create, { type: 'offer', agentId: 'agent-2', title: 'O', description: 'D', skills: ['s'] });
      const { matchId } = await t.mutation(api.matches.create, { needIntentId: need.intentId, offerIntentId: offer.intentId, score: 85, algorithm: 'test' });
      const disputeId = await t.run(async (ctx) => {
        return await ctx.db.insert('disputes', {
          matchId,
          initiatorAgentId: 'agent-1',
          reason: 'Test',
          evidence: ['Evidence'],
          status: 'voting',
          tier: 2,
          createdAt: Date.now(),
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('votes', {
          disputeId,
          agentId: 'agent-1',
          vote: 'uphold',
          weight: 75,
          createdAt: Date.now(),
        });
        await ctx.db.insert('votes', {
          disputeId,
          agentId: 'agent-2',
          vote: 'refund',
          weight: 60,
          createdAt: Date.now(),
        });
      });

      const allVotes = await t.query(api.votes.list, { disputeId });
      expect(allVotes.length).toBe(2);

      const agent1Votes = await t.query(api.votes.list, { agentId: 'agent-1' });
      expect(agent1Votes.length).toBe(1);
    });

    it('should update vote', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, { type: 'need', agentId: 'agent-1', title: 'N', description: 'D', skills: ['s'] });
      const offer = await t.mutation(api.intents.create, { type: 'offer', agentId: 'agent-2', title: 'O', description: 'D', skills: ['s'] });
      const { matchId } = await t.mutation(api.matches.create, { needIntentId: need.intentId, offerIntentId: offer.intentId, score: 85, algorithm: 'test' });
      const voteId = await t.run(async (ctx) => {
        const disputeId = await ctx.db.insert('disputes', {
          matchId,
          initiatorAgentId: 'agent-1',
          reason: 'Test',
          evidence: ['Evidence'],
          status: 'voting',
          tier: 2,
          createdAt: Date.now(),
        });
        return await ctx.db.insert('votes', {
          disputeId,
          agentId: 'agent-1',
          vote: 'uphold',
          weight: 75,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.votes.update, {
        voteId,
        vote: 'refund',
        justification: 'Changed my mind',
      });

      const vote = await t.run(async (ctx) => await ctx.db.get(voteId));
      expect(vote?.vote).toBe('refund');
      expect(vote?.justification).toBe('Changed my mind');
    });

    it('should retract vote', async () => {
      const t = convexTest(schema, modules);
      const need = await t.mutation(api.intents.create, { type: 'need', agentId: 'agent-1', title: 'N', description: 'D', skills: ['s'] });
      const offer = await t.mutation(api.intents.create, { type: 'offer', agentId: 'agent-2', title: 'O', description: 'D', skills: ['s'] });
      const { matchId } = await t.mutation(api.matches.create, { needIntentId: need.intentId, offerIntentId: offer.intentId, score: 85, algorithm: 'test' });
      const voteId = await t.run(async (ctx) => {
        const disputeId = await ctx.db.insert('disputes', {
          matchId,
          initiatorAgentId: 'agent-1',
          reason: 'Test',
          evidence: ['Evidence'],
          status: 'voting',
          tier: 2,
          createdAt: Date.now(),
        });
        return await ctx.db.insert('votes', {
          disputeId,
          agentId: 'agent-1',
          vote: 'uphold',
          weight: 75,
          createdAt: Date.now(),
        });
      });

      await t.mutation(api.votes.retract, { voteId });

      const vote = await t.run(async (ctx) => await ctx.db.get(voteId));
      expect(vote).toBeNull();
    });
  });
});
