import type { IntentDraft, IntentPreview } from './types.js';
import { validateIntent } from './validate.js';

export function buildIntentPreview(draft: Partial<IntentDraft>): IntentPreview {
  const validation = validateIntent(draft);

  let pricingSummary: string | undefined;
  if (draft.amount !== undefined && draft.currency) {
    const model = draft.pricingModel ?? 'fixed';
    pricingSummary = `${draft.amount} ${draft.currency} (${model})`;
  }

  return {
    type: (draft.type ?? 'offer') as IntentPreview['type'],
    title: draft.title ?? '',
    description: draft.description ?? '',
    skills: Array.isArray(draft.skills) ? draft.skills : [],
    pricingSummary,
    validation,
  };
}
