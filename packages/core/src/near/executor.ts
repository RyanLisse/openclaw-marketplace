/**
 * NEAR Intent Executor
 * 
 * Executes NEAR intents on the blockchain.
 * Framework-agnostic - no React dependencies.
 * 
 * This module provides interfaces and execution logic.
 * Actual signing is done by a signer implementation (wallet, local key, etc.).
 */

import type {
  NearIntent,
  NearSigner,
  TransactionPreview,
  ExecutionResult,
  NetworkConfig,
} from './types.js';
import { buildPreview, requiresApproval } from './preview.js';

/**
 * Default network configurations
 */
export const DEFAULT_NETWORKS: Record<'testnet' | 'mainnet', NetworkConfig> = {
  testnet: {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://testnet.mynearwallet.com',
    explorerUrl: 'https://testnet.nearblocks.io',
  },
  mainnet: {
    networkId: 'mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
    walletUrl: 'https://app.mynearwallet.com',
    explorerUrl: 'https://nearblocks.io',
  },
};

/**
 * Intent executor configuration
 */
export interface ExecutorConfig {
  network: 'testnet' | 'mainnet';
  networkConfig?: NetworkConfig;
  signer: NearSigner;
  approvalPolicy?: {
    requireApprovalForHighValue: boolean;
    highValueThreshold: number; // in NEAR
    requireApprovalForIrreversible: boolean;
  };
}

/**
 * Execute a NEAR intent
 * 
 * @param intent - The intent to execute
 * @param config - Executor configuration
 * @returns Execution result
 */
export async function executeIntent(
  intent: NearIntent,
  config: ExecutorConfig
): Promise<ExecutionResult> {
  // Build preview first
  const preview = buildPreview(intent, config.network);
  
  if (!preview) {
    return {
      success: false,
      status: 'failed',
      error: {
        code: 'INVALID_INTENT',
        message: 'Could not build transaction preview from intent',
      },
    };
  }

  // Check for warnings and require approval if needed
  const needsApproval = requiresApproval(intent) || 
    (config.approvalPolicy?.requireApprovalForHighValue && isHighValue(intent, config.approvalPolicy.highValueThreshold)) ||
    (config.approvalPolicy?.requireApprovalForIrreversible && isIrreversible(intent));

  if (needsApproval && !preview.requiresUserApproval) {
    // Update preview to indicate approval is needed based on policy
    preview.requiresUserApproval = true;
  }

  // Execute transactions
  const txHashes: string[] = [];
  const errors: Array<{ code: string; message: string; details?: unknown }> = [];

  for (const tx of preview.transactions) {
    try {
      const result = await config.signer.signAndSendTransaction(tx);
      
      if (result.success) {
        if (result.txHashes) {
          txHashes.push(...result.txHashes);
        }
      } else {
        errors.push({
          code: result.error?.code || 'EXECUTION_FAILED',
          message: result.error?.message || 'Transaction execution failed',
          details: result.error?.details,
        });
        break; // Stop on first error
      }
    } catch (error) {
      errors.push({
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      });
      break;
    }
  }

  // Return final result
  if (errors.length > 0) {
    return {
      success: false,
      status: 'failed',
      error: errors[0],
    };
  }

  return {
    success: true,
    status: 'executed',
    txHashes: txHashes.length > 0 ? txHashes : undefined,
  };
}

/**
 * Execute intent with preview first (for user confirmation)
 * 
 * @param intent - The intent to execute
 * @param config - Executor configuration
 * @returns Object with preview and execute function
 */
export function prepareExecution(
  intent: NearIntent,
  config: ExecutorConfig
): {
  preview: TransactionPreview | null;
  canExecute: boolean;
  execute: () => Promise<ExecutionResult>;
} {
  const preview = buildPreview(intent, config.network);
  
  return {
    preview,
    canExecute: preview !== null,
    execute: () => executeIntent(intent, config),
  };
}

/**
 * Simulate intent execution without actually executing
 * Useful for dry-run mode
 * 
 * @param intent - The intent to simulate
 * @param network - Network (testnet or mainnet)
 * @returns Execution result with simulated success
 */
export function simulateExecution(
  intent: NearIntent,
  network: 'testnet' | 'mainnet' = 'testnet'
): ExecutionResult {
  const preview = buildPreview(intent, network);
  
  if (!preview) {
    return {
      success: false,
      status: 'failed',
      error: {
        code: 'INVALID_INTENT',
        message: 'Could not build transaction preview from intent',
      },
    };
  }

  // Simulate successful execution
  const mockTxHashes = preview.transactions.map(
    (_, i) => `simulated_${intent.type}_${i}_${Date.now()}`
  );

  return {
    success: true,
    status: 'executed',
    txHashes: mockTxHashes,
  };
}

/**
 * Check if intent is high-value (requires extra approval)
 */
function isHighValue(intent: NearIntent, threshold: number): boolean {
  switch (intent.type) {
    case 'transfer':
      return parseFloat(intent.amount) > threshold;
    case 'swap':
      return parseFloat(intent.amount) > threshold;
    case 'stake':
      return parseFloat(intent.amount) > threshold;
    case 'unstake':
      return intent.amount ? parseFloat(intent.amount) > threshold : false;
    default:
      return false;
  }
}

/**
 * Check if intent is irreversible (requires extra approval)
 */
function isIrreversible(intent: NearIntent): boolean {
  // Operations that lock funds or create permanent state
  switch (intent.type) {
    case 'stake':
      return true; // Locking funds for 2+ days
    case 'create_account':
      return true; // Permanent on-chain state
    case 'call':
      // Contract calls with large deposits
      const deposit = intent.deposit ? BigInt(intent.deposit) : BigInt(0);
      return deposit > BigInt('1000000000000000000000000'); // >0.001 NEAR
    default:
      return false;
  }
}

/**
 * Get transaction URL for explorer
 * 
 * @param txHash - Transaction hash
 * @param network - Network
 * @returns Explorer URL
 */
export function getExplorerUrl(
  txHash: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): string {
  const config = DEFAULT_NETWORKS[network];
  return `${config.explorerUrl}/txns/${txHash}`;
}

/**
 * Create a signer from wallet selector
 * This is a convenience function for UI implementations
 * 
 * @param selector - Wallet selector instance
 * @returns NearSigner implementation
 */
export function createWalletSelectorSigner(selector: any): NearSigner {
  return {
    async signAndSendTransaction(tx) {
      try {
        const wallet = await selector.wallet();
        const result = await wallet.signAndSendTransaction({
          receiverId: tx.receiverId,
          actions: tx.actions.map(action => {
            if (action.kind === 'Transfer') {
              return {
                type: 'Transfer',
                params: { deposit: action.deposit },
              };
            } else {
              return {
                type: 'FunctionCall',
                params: {
                  methodName: action.methodName,
                  args: action.args,
                  gas: action.gas,
                  deposit: action.deposit,
                },
              };
            }
          }),
        });

        return {
          success: true,
          status: 'executed',
          txHashes: [result.transaction?.hash],
        };
      } catch (error) {
        return {
          success: false,
          status: 'failed',
          error: {
            code: 'WALLET_ERROR',
            message: error instanceof Error ? error.message : 'Wallet error',
            details: error,
          },
        };
      }
    },
  };
}

/**
 * Policy presets for different security levels
 */
export const POLICY_PRESETS = {
  strict: {
    requireApprovalForHighValue: true,
    highValueThreshold: 1, // 1 NEAR
    requireApprovalForIrreversible: true,
  },
  balanced: {
    requireApprovalForHighValue: true,
    highValueThreshold: 50, // 50 NEAR
    requireApprovalForIrreversible: true,
  },
  permissive: {
    requireApprovalForHighValue: false,
    highValueThreshold: Infinity,
    requireApprovalForIrreversible: false,
  },
} as const;
