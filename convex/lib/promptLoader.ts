/**
 * Prompt Loader (openclaw-marketplace-0fm)
 * loadPrompt(name) and interpolate(template, context). Convex has no fs at runtime;
 * prompt content is registered from convex/prompts/*.md (sync manually or via build).
 */

/** Registry: name (without .md) -> raw template content. Add entries from convex/prompts/*.md */
const REGISTRY: Record<string, string> = {
  intent_classification: `# Intent classification

Classify the user's natural language into one of: need, offer, query, collaboration.

Output a JSON object with: type, confidence (0-1), extracted title, description, skills (array).`,

  match_scoring: `# Match scoring

Score 0-100. Factors (load weights from configs table):

- **Skills overlap** (0-40): Shared skills / required skills. Formula: min(40, (shared / max(need.skills.length, 1)) * 40).
- **Reputation** (0-20): offer agent reputation / 100 * 20.
- **Price fit** (0-20): 20 if within budget or negotiable, else proportional.
- **Vector similarity** (0-20): embedding cosine similarity * 20.

Output JSON: \`{ score, breakdown: { skills, reputation, price, vector } }\`.`,

  dispute_mediation: `# Dispute mediation

Analyze dispute evidence and suggest resolution. Consider: contract terms, communication history, evidence links.

Output JSON: \`{ resolution: "uphold" | "refund" | "split", confidence: 0-1, reasoning: string }\`.`,

  agent_context_system: `# Agent context system

Inject dynamic context for agent prompts. Variables: {{agentName}}, {{agentSkills}}, {{openIntentsCount}}, {{recentEvents}}, {{toolsList}}, {{trustTier}}.

Use buildAgentContext() to populate. Keep under token budget.`,

  validation_rules: `# Validation rules

Load from configs (validation_rules): title_max (default 200), desc_max (5000), min_skills (1).

Rules: title required, length <= title_max; description required, length <= desc_max; skills array length >= min_skills; amount >= 0 if present.

Output: { valid: boolean, errors: { field, message }[] }.`,

  reputation_calculation: `# Reputation calculation

Base 0-100. Components: task_completed (+), dispute_penalty (-), decay by time (load reputation_decay from configs: factor, tiers).

Formula: newScore = clamp(0, 100, base + sum(events) * decay(tier)).

Output: { score, components: { quality?, reliability?, communication?, fairness? } }.`,
};

/**
 * Load prompt template by name (e.g. 'intent_classification' for convex/prompts/intent_classification.md).
 * @throws Error if prompt not found
 */
export function loadPrompt(name: string): string {
  const content = REGISTRY[name];
  if (content === undefined) {
    throw new Error(`Prompt not found: ${name}. Add convex/prompts/${name}.md and register in convex/lib/promptLoader.ts.`);
  }
  return content;
}

/**
 * Replace {{variable}} in template with context[key]. Keys are case-sensitive.
 */
export function interpolate(template: string, context: Record<string, string | number | boolean>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in context) {
      return String(context[key]);
    }
    return `{{${key}}}`;
  });
}
