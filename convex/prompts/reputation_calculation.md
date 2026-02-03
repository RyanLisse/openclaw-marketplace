# Reputation calculation

Base 0-100. Components: task_completed (+), dispute_penalty (-), decay by time (load reputation_decay from configs: factor, tiers).

Formula: newScore = clamp(0, 100, base + sum(events) * decay(tier)).

Output: { score, components: { quality?, reliability?, communication?, fairness? } }.
