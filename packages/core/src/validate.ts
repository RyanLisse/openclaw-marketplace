import type { IntentDraft, ValidationResult, ValidationError } from './types.js';

export function validateIntent(draft: Partial<IntentDraft>): ValidationResult {
  const errors: ValidationError[] = [];

  const validTypes = ['need', 'offer', 'query', 'collaboration'];
  if (draft.type && !validTypes.includes(draft.type)) {
    errors.push({ field: 'type', message: `Invalid type: must be one of ${validTypes.join(', ')}` });
  }

  if (!draft.title?.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (draft.title.length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
  }

  if (!draft.description?.trim()) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (draft.description.length > 5000) {
    errors.push({ field: 'description', message: 'Description must be 5000 characters or less' });
  }

  const skills = draft.skills ?? [];
  if (!Array.isArray(skills) || skills.length === 0) {
    errors.push({ field: 'skills', message: 'Add at least one skill' });
  } else if (skills.some((s) => typeof s !== 'string' || !s.trim())) {
    errors.push({ field: 'skills', message: 'All skills must be non-empty strings' });
  }

  if (draft.amount !== undefined && (typeof draft.amount !== 'number' || draft.amount < 0)) {
    errors.push({ field: 'amount', message: 'Amount must be a non-negative number' });
  }

  return { valid: errors.length === 0, errors };
}
