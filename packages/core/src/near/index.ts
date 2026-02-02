/**
 * NEAR Intent Core Library
 * 
 * Framework-agnostic library for parsing, validating, previewing, and executing
 * NEAR blockchain intents from natural language.
 * 
 * This library can be used by:
 * - UI components (React, Vue, etc.)
 * - CLI tools
 * - MCP servers
 * - Any JavaScript/TypeScript environment
 * 
 * @example
 * ```ts
 * import { parseIntent, buildPreview, executeIntent } from '@openclaw/core/near';
 * 
 * // Parse natural language
 * const { intent, warnings } = parseIntent("Swap 1 NEAR for USDC");
 * 
 * // Build preview
 * const preview = buildPreview(intent!, 'testnet');
 * 
 * // Execute (with signer)
 * const result = await executeIntent(intent!, { network: 'testnet', signer });
 * ```
 */

// Type definitions
export type {
  NearIntent,
  NearIntentType,
  BaseIntent,
  TransferIntent,
  SwapIntent,
  StakeIntent,
  UnstakeIntent,
  CallIntent,
  CreateAccountIntent,
  TransactionAction,
  NearTransaction,
  ParseResult,
  ValidationResult,
  TransactionPreview,
  ExecutionResult,
  NearSigner,
  NetworkConfig,
  ProtocolConfig,
} from './types.js';

// Parser
export {
  parseIntent,
  parseAndValidate,
} from './parser.js';

// Validator
export {
  validateIntent,
} from './validator.js';

// Preview builder
export {
  buildPreview,
  requiresApproval,
} from './preview.js';

// Executor
export {
  executeIntent,
  prepareExecution,
  simulateExecution,
  getExplorerUrl,
  createWalletSelectorSigner,
  DEFAULT_NETWORKS,
  POLICY_PRESETS,
} from './executor.js';

export type {
  ExecutorConfig,
} from './executor.js';
