/**
 * Seed Configs (openclaw-marketplace-2ds)
 * 4 initial configs. Run seed mutation once on deployment (e.g. from dashboard or CLI).
 */
import { mutation } from '../_generated/server';

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const configs = [
      {
        key: 'matching_weights',
        value: { vector: 0.4, reputation: 0.2, price: 0.2, skills: 0.2 },
        version: 1,
      },
      {
        key: 'validation_rules',
        value: { title_max: 200, desc_max: 5000, min_skills: 1 },
        version: 1,
      },
      {
        key: 'match_threshold',
        value: 60,
        version: 1,
      },
      {
        key: 'reputation_decay',
        value: {
          factor: 0.95,
          tiers: [
            { minScore: 80, decayPerDay: 0.01 },
            { minScore: 50, decayPerDay: 0.02 },
            { minScore: 0, decayPerDay: 0.03 },
          ],
        },
        version: 1,
      },
    ];

    let created = 0;
    for (const c of configs) {
      const existing = await ctx.db
        .query('configs')
        .withIndex('by_key_active', (q) => q.eq('key', c.key).eq('isActive', true))
        .first();
      if (!existing) {
        await ctx.db.insert('configs', {
          key: c.key,
          value: c.value,
          version: c.version,
          isActive: true,
          createdAt: Date.now(),
        });
        created++;
      }
    }
    return { created, total: configs.length };
  },
});
