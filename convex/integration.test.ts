import { describe, it, expect } from 'vitest';
import { loadPrompt, interpolate } from './lib/promptLoader';
import { convexTest } from 'convex-test';
import { api } from './_generated/api';
import schema from './schema';

describe('Week 2 Integration Tests - Prompt-Native & Context Injection', () => {
  describe('Prompt Loading', () => {
    it('should load intent_classification prompt', () => {
      const prompt = loadPrompt('intent_classification');
      expect(prompt).toContain('Intent classification');
      expect(prompt).toContain('need, offer, query, collaboration');
    });

    it('should load match_scoring prompt', () => {
      const prompt = loadPrompt('match_scoring');
      expect(prompt).toContain('Match scoring');
      expect(prompt).toContain('Skills overlap');
      expect(prompt).toContain('0-40');
    });

    it('should load dispute_mediation prompt', () => {
      const prompt = loadPrompt('dispute_mediation');
      expect(prompt).toContain('Dispute mediation');
      expect(prompt).toContain('uphold');
      expect(prompt).toContain('refund');
    });

    it('should load agent_context_system prompt', () => {
      const prompt = loadPrompt('agent_context_system');
      expect(prompt).toContain('Agent context');
      expect(prompt).toContain('{{agentName}}');
    });

    it('should load validation_rules prompt', () => {
      const prompt = loadPrompt('validation_rules');
      expect(prompt).toContain('Validation rules');
      expect(prompt).toContain('title_max');
    });

    it('should load reputation_calculation prompt', () => {
      const prompt = loadPrompt('reputation_calculation');
      expect(prompt).toContain('Reputation calculation');
      expect(prompt).toContain('0-100');
    });

    it('should throw error for non-existent prompt', () => {
      expect(() => loadPrompt('nonexistent_prompt')).toThrow('Prompt not found');
    });
  });

  describe('Prompt Interpolation', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{name}}!';
      const result = interpolate(template, { name: 'Alice' });
      expect(result).toBe('Hello Alice!');
    });

    it('should replace multiple variables', () => {
      const template = '{{agentName}} has {{skillCount}} skills in {{domain}}';
      const result = interpolate(template, {
        agentName: 'Agent-123',
        skillCount: 5,
        domain: 'TypeScript',
      });
      expect(result).toBe('Agent-123 has 5 skills in TypeScript');
    });

    it('should handle missing variables by leaving them unchanged', () => {
      const template = 'Hello {{name}}, your score is {{score}}';
      const result = interpolate(template, { name: 'Bob' });
      expect(result).toBe('Hello Bob, your score is {{score}}');
    });

    it('should handle boolean values', () => {
      const template = 'Is active: {{active}}';
      const result = interpolate(template, { active: true });
      expect(result).toBe('Is active: true');
    });

    it('should handle number values', () => {
      const template = 'Count: {{count}}, Price: {{price}}';
      const result = interpolate(template, { count: 42, price: 99.95 });
      expect(result).toBe('Count: 42, Price: 99.95');
    });

    it('should not replace partial matches', () => {
      const template = 'Template {{name}} and {{username}}';
      const result = interpolate(template, { name: 'test' });
      expect(result).toBe('Template test and {{username}}');
    });
  });

  describe('Config Queries', () => {
    it('should query validation_rules config', async () => {
      const t = convexTest(schema);
      
      // Seed config
      await t.run(async (ctx) => {
        await ctx.db.insert('configs', {
          key: 'validation_rules',
          value: {
            title_max_length: 200,
            description_max_length: 5000,
            min_skills: 1,
          },
          version: 1,
          createdAt: Date.now(),
        });
      });

      // Query config
      const config = await t.run(async (ctx) => {
        return await ctx.db
          .query('configs')
          .filter((q) => q.eq(q.field('key'), 'validation_rules'))
          .first();
      });

      expect(config).toBeDefined();
      expect(config?.key).toBe('validation_rules');
      expect(config?.value.title_max_length).toBe(200);
      expect(config?.value.min_skills).toBe(1);
    });

    it('should query match_scoring_weights config', async () => {
      const t = convexTest(schema);
      
      await t.run(async (ctx) => {
        await ctx.db.insert('configs', {
          key: 'match_scoring_weights',
          value: {
            skillsWeight: 40,
            reputationWeight: 20,
            priceWeight: 20,
            vectorWeight: 20,
          },
          version: 1,
          createdAt: Date.now(),
        });
      });

      const config = await t.run(async (ctx) => {
        return await ctx.db
          .query('configs')
          .filter((q) => q.eq(q.field('key'), 'match_scoring_weights'))
          .first();
      });

      expect(config).toBeDefined();
      expect(config?.value.skillsWeight).toBe(40);
      expect(config?.value.reputationWeight).toBe(20);
      expect(config?.value.priceWeight).toBe(20);
      expect(config?.value.vectorWeight).toBe(20);
    });

    it('should support config versioning', async () => {
      const t = convexTest(schema);
      
      // Insert v1
      await t.run(async (ctx) => {
        await ctx.db.insert('configs', {
          key: 'test_config',
          value: { setting: 'old' },
          version: 1,
          createdAt: Date.now(),
        });
      });

      // Update to v2
      await t.run(async (ctx) => {
        const config = await ctx.db
          .query('configs')
          .filter((q) => q.eq(q.field('key'), 'test_config'))
          .first();
        
        if (config) {
          await ctx.db.patch(config._id, {
            value: { setting: 'new' },
            version: 2,
            updatedAt: Date.now(),
          });
        }
      });

      const config = await t.run(async (ctx) => {
        return await ctx.db
          .query('configs')
          .filter((q) => q.eq(q.field('key'), 'test_config'))
          .first();
      });

      expect(config?.version).toBe(2);
      expect(config?.value.setting).toBe('new');
      expect(config?.updatedAt).toBeDefined();
    });
  });

  describe('Context Builder (Mock)', () => {
    it('should build agent context with all variables', () => {
      // Mock context builder output
      const context = {
        agentName: 'TestAgent',
        agentSkills: ['typescript', 'react'],
        openIntentsCount: 5,
        recentEvents: 'Created intent, accepted match',
        toolsList: 'intent_create, match_accept',
        trustTier: 1,
      };

      const template = `Agent: {{agentName}}
Skills: {{agentSkills}}
Open Intents: {{openIntentsCount}}
Recent: {{recentEvents}}
Tools: {{toolsList}}
Trust Tier: {{trustTier}}`;

      const result = interpolate(template, context as any);

      expect(result).toContain('Agent: TestAgent');
      expect(result).toContain('Skills: typescript,react');
      expect(result).toContain('Open Intents: 5');
      expect(result).toContain('Trust Tier: 1');
    });

    it('should build minimal context with defaults', () => {
      const context = {
        agentName: 'MinimalAgent',
        openIntentsCount: 0,
      };

      const template = `Agent: {{agentName}}, Intents: {{openIntentsCount}}`;
      const result = interpolate(template, context);

      expect(result).toBe('Agent: MinimalAgent, Intents: 0');
    });
  });

  describe('End-to-End Prompt Flow', () => {
    it('should load prompt and interpolate context', () => {
      const prompt = loadPrompt('agent_context_system');
      const context = {
        agentName: 'FlowTest',
        agentSkills: 'coding',
        openIntentsCount: 3,
        recentEvents: 'none',
        toolsList: 'all',
        trustTier: 2,
      };

      const result = interpolate(prompt, context as any);

      expect(result).toContain('FlowTest');
      expect(result).toContain('coding');
      expect(result).toContain('3');
    });

    it('should support dynamic weight loading for scoring', async () => {
      const t = convexTest(schema);
      
      // Seed weights
      await t.run(async (ctx) => {
        await ctx.db.insert('configs', {
          key: 'custom_agent_weights',
          value: {
            skillsWeight: 60,  // Agent prioritizes skills
            reputationWeight: 10,
            priceWeight: 10,
            vectorWeight: 20,
          },
          version: 1,
          createdAt: Date.now(),
        });
      });

      const weights = await t.run(async (ctx) => {
        const config = await ctx.db
          .query('configs')
          .filter((q) => q.eq(q.field('key'), 'custom_agent_weights'))
          .first();
        return config?.value;
      });

      expect(weights?.skillsWeight).toBe(60);
      expect(weights?.skillsWeight + weights?.reputationWeight + weights?.priceWeight + weights?.vectorWeight).toBe(100);
    });
  });
});
