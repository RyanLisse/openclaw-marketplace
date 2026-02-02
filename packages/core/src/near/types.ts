/**
 * NEAR Intent Types
 * 
 * Framework-agnostic types for NEAR blockchain intents.
 * Used by UI, CLI, and MCP server.
 */

/**
 * Supported NEAR intent types
 */
export type NearIntentType =
  | "transfer"
  | "swap"
  | "stake"
  | "unstake"
  | "call"
  | "create_account";

/**
 * Base intent structure
 */
export interface BaseIntent {
  type: NearIntentType;
}

/**
 * Transfer native or fungible tokens to another account
 */
export interface TransferIntent extends BaseIntent {
  type: "transfer";
  token: string;       // Token contract ID or "NEAR" for native token
  amount: string;      // Amount in human-readable format (e.g., "1.5")
  to: string;          // Recipient account ID
}

/**
 * Swap tokens on a DEX protocol (e.g., Ref Finance)
 */
export interface SwapIntent extends BaseIntent {
  type: "swap";
  fromToken: string;   // Source token contract ID or "NEAR"
  toToken: string;     // Target token contract ID
  amount: string;      // Amount to swap
  protocol?: string;   // DEX protocol to use (default: "ref.finance")
  slippageBps?: number; // Slippage tolerance in basis points (optional)
}

/**
 * Stake NEAR tokens with a validator
 */
export interface StakeIntent extends BaseIntent {
  type: "stake";
  validator: string;   // Validator account ID (e.g., "pool.f863973.m0")
  amount: string;      // Amount to stake
}

/**
 * Unstake NEAR tokens from a validator
 */
export interface UnstakeIntent extends BaseIntent {
  type: "unstake";
  validator: string;   // Validator account ID
  amount?: string;     // Amount to unstake (optional, defaults to all)
}

/**
 * Generic smart contract call
 */
export interface CallIntent extends BaseIntent {
  type: "call";
  contract: string;    // Contract account ID
  method: string;      // Method name to call
  args: Record<string, unknown>;  // Method arguments
  gas?: string;        // Gas limit (optional, e.g., "300000000000000")
  deposit?: string;    // Attached deposit in yoctoNEAR (optional)
}

/**
 * Create a new NEAR account
 */
export interface CreateAccountIntent extends BaseIntent {
  type: "create_account";
  accountId: string;   // New account ID
  publicKey: string;   // Public key for the new account (base58 encoded)
  initialBalance?: string;  // Initial balance (optional)
}

/**
 * Union type of all NEAR intents
 */
export type NearIntent =
  | TransferIntent
  | SwapIntent
  | StakeIntent
  | UnstakeIntent
  | CallIntent
  | CreateAccountIntent;

/**
 * Transaction action types
 */
export type TransactionAction =
  | { kind: "Transfer"; deposit: string }
  | { kind: "FunctionCall"; methodName: string; args: unknown; gas: string; deposit: string };

/**
 * NEAR transaction structure
 */
export interface NearTransaction {
  receiverId: string;
  actions: TransactionAction[];
}

/**
 * Intent parsing result
 */
export interface ParseResult {
  intent: NearIntent | null;
  confidence: number;  // 0-1 score
  warnings: string[];
  missingFields: string[];
}

/**
 * Intent validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Transaction preview for user confirmation
 */
export interface TransactionPreview {
  intent: NearIntent;
  description: string;
  network: "testnet" | "mainnet";
  transactions: NearTransaction[];
  estimatedGasNear?: string;
  estimatedTotalCostNear?: string;
  warnings: string[];
  requiresUserApproval: boolean;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  success: boolean;
  status: "submitted" | "executed" | "failed";
  txHashes?: string[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Signer interface for executing transactions
 */
export interface NearSigner {
  signAndSendTransaction(tx: NearTransaction): Promise<ExecutionResult>;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  networkId: string;
  nodeUrl: string;
  walletUrl?: string;
  explorerUrl?: string;
}

/**
 * Protocol configuration for swaps
 */
export interface ProtocolConfig {
  name: string;
  contractId: string;
  supportedTokens: string[];
  defaultSlippageBps: number;
}
