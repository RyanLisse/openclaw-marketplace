/**
 * @openclaw/core - Framework-agnostic intent logic
 * Used by UI, CLI, and MCP server
 */

// Marketplace intents (existing)
export type {
  IntentType,
  IntentStatus,
  IntentDraft,
  ValidationResult,
  IntentPreview,
} from './types.js';

export { validateIntent } from './validate.js';
export { parseIntentFromText, parseAndValidate } from './parse.js';
export { buildIntentPreview } from './preview.js';

// NEAR intents (new)
export * from './near/index.js';
