import type { IntentDraft, IntentType } from './types.js';
import { validateIntent } from './validate.js';

const TYPE_PATTERNS: { pattern: RegExp; type: IntentType }[] = [
  { pattern: /\b(need|want|looking for|seeking|searching for)\b/i, type: 'need' },
  { pattern: /\b(offer|providing|can help|available to|selling)\b/i, type: 'offer' },
  { pattern: /\b(question|query|ask|wondering|curious)\b/i, type: 'query' },
  { pattern: /\b(collaborate|partnership|team up|work together|joint)\b/i, type: 'collaboration' },
];

export function parseIntentFromText(text: string): Partial<IntentDraft> {
  const trimmed = text.trim();
  if (!trimmed) return {};

  let type: IntentType = 'offer';
  for (const { pattern, type: t } of TYPE_PATTERNS) {
    if (pattern.test(trimmed)) {
      type = t;
      break;
    }
  }

  const lines = trimmed.split(/\n+/);
  const firstLine = lines[0] ?? trimmed;
  const rest = lines.slice(1).join('\n').trim();

  const skillsMatch = trimmed.match(/\b(?:skills?|tags?):\s*([^\n]+)/i);
  const skills = skillsMatch
    ? skillsMatch[1].split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    type,
    title: firstLine.slice(0, 200),
    description: rest || firstLine,
    skills: skills.length > 0 ? skills : [],
  };
}

export function parseAndValidate(text: string): { draft: Partial<IntentDraft>; validation: ReturnType<typeof validateIntent> } {
  const draft = parseIntentFromText(text);
  const validation = validateIntent(draft);
  return { draft, validation };
}
