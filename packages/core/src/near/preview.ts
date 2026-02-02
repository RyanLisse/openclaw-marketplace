/**
 * NEAR Intent Preview Builder
 * 
 * Builds transaction previews from NEAR intents.
 * Framework-agnostic - no React dependencies.
 */

import type {
  NearIntent,
  TransactionPreview,
  NearTransaction,
  TransactionAction,
  SwapIntent,
  StakeIntent,
} from './types.js';
import { validateIntent } from './validator.js';

/**
 * Build a transaction preview from an intent
 * 
 * @param intent - The intent to preview
 * @param network - Network (testnet or mainnet)
 * @returns Transaction preview
 */
export function buildPreview(
  intent: NearIntent,
  network: 'testnet' | 'mainnet' = 'testnet'
): TransactionPreview | null {
  const validation = validateIntent(intent);
  
  // Don't build preview for invalid intents
  if (!validation.valid) {
    return null;
  }

  switch (intent.type) {
    case 'swap':
      return buildSwapPreview(intent, network, validation.warnings);
    case 'stake':
      return buildStakePreview(intent, network, validation.warnings);
    case 'unstake':
      return buildUnstakePreview(intent, network, validation.warnings);
    case 'transfer':
      return buildTransferPreview(intent, network, validation.warnings);
    case 'call':
      return buildCallPreview(intent, network, validation.warnings);
    case 'create_account':
      return buildCreateAccountPreview(intent, network, validation.warnings);
    default:
      return null;
  }
}

/**
 * Build swap transaction preview
 */
function buildSwapPreview(
  intent: SwapIntent,
  network: 'testnet' | 'mainnet',
  existingWarnings: string[]
): TransactionPreview {
  const protocol = intent.protocol || 'ref.finance';
  
  // Convert amount to yoctoNEAR (multiply by 10^24)
  const amountInYocto = parseAmountToYocto(intent.amount);
  
  // Default slippage if not specified
  const minAmountOut = intent.slippageBps 
    ? calculateMinAmountOut(intent.amount, intent.slippageBps)
    : '0';

  const transaction: NearTransaction = {
    receiverId: network === 'testnet' 
      ? 'v2.ref-finance.testnet' 
      : 'v2.ref-finance.near',
    actions: [
      {
        kind: 'FunctionCall',
        methodName: 'swap',
        args: {
          actions: [
            {
              pool_id: 0, // In production, this would be queried from the DEX
              token_in: intent.fromToken === 'NEAR' ? 'wrap.testnet' : intent.fromToken,
              token_out: intent.toToken,
              amount_in: amountInYocto,
              min_amount_out: minAmountOut,
            }
          ]
        },
        gas: '300000000000000', // 300 Tgas
        deposit: '1', // 1 yoctoNEAR for storage
      }
    ]
  };

  const warnings = [...existingWarnings];
  if (intent.slippageBps === undefined) {
    warnings.push('min_amount_out is set to 0. Transaction may fail due to price movement.');
  }

  return {
    intent,
    description: `Swap ${intent.amount} ${intent.fromToken.toUpperCase()} for ${intent.toToken.toUpperCase()} on ${protocol}`,
    network,
    transactions: [transaction],
    estimatedGasNear: '0.003',
    estimatedTotalCostNear: `${intent.amount} NEAR + fees`,
    warnings,
    requiresUserApproval: true,
  };
}

/**
 * Build stake transaction preview
 */
function buildStakePreview(
  intent: StakeIntent,
  network: 'testnet' | 'mainnet',
  existingWarnings: string[]
): TransactionPreview {
  const amountInYocto = parseAmountToYocto(intent.amount);

  const transaction: NearTransaction = {
    receiverId: intent.validator,
    actions: [
      {
        kind: 'FunctionCall',
        methodName: 'deposit_and_stake',
        args: {},
        gas: '125000000000000', // 125 Tgas
        deposit: amountInYocto,
      }
    ]
  };

  return {
    intent,
    description: `Stake ${intent.amount} NEAR with ${intent.validator}`,
    network,
    transactions: [transaction],
    estimatedGasNear: '0.001',
    estimatedTotalCostNear: `${intent.amount} NEAR + fees`,
    warnings: existingWarnings,
    requiresUserApproval: true,
  };
}

/**
 * Build unstake transaction preview
 */
function buildUnstakePreview(
  intent: { type: 'unstake'; validator: string; amount?: string },
  network: 'testnet' | 'mainnet',
  existingWarnings: string[]
): TransactionPreview {
  const transaction: NearTransaction = {
    receiverId: intent.validator,
    actions: [
      {
        kind: 'FunctionCall',
        methodName: 'unstake_all',
        args: {},
        gas: '125000000000000',
        deposit: '0',
      }
    ]
  };

  return {
    intent,
    description: intent.amount
      ? `Unstake ${intent.amount} NEAR from ${intent.validator}`
      : `Unstake all NEAR from ${intent.validator}`,
    network,
    transactions: [transaction],
    estimatedGasNear: '0.001',
    estimatedTotalCostNear: '0.001 NEAR (gas only)',
    warnings: existingWarnings,
    requiresUserApproval: true,
  };
}

/**
 * Build transfer transaction preview
 */
function buildTransferPreview(
  intent: { type: 'transfer'; token: string; amount: string; to: string },
  network: 'testnet' | 'mainnet',
  existingWarnings: string[]
): TransactionPreview {
  const isNative = intent.token.toUpperCase() === 'NEAR';
  
  const transaction: NearTransaction = {
    receiverId: intent.to,
    actions: isNative
      ? [
          {
            kind: 'Transfer',
            deposit: parseAmountToYocto(intent.amount),
          }
        ]
      : [
          {
            kind: 'FunctionCall',
            methodName: 'ft_transfer',
            args: {
              receiver_id: intent.to,
              amount: parseAmountToYocto(intent.amount),
              memo: null,
            },
            gas: '5000000000000', // 5 Tgas for FT transfer
            deposit: '1',
          }
        ]
  };

  return {
    intent,
    description: `Transfer ${intent.amount} ${intent.token.toUpperCase()} to ${intent.to}`,
    network,
    transactions: [transaction],
    estimatedGasNear: isNative ? '0.0001' : '0.0002',
    estimatedTotalCostNear: isNative 
      ? `${intent.amount} NEAR + fees`
      : `${intent.amount} ${intent.token.toUpperCase()} + gas fees`,
    warnings: existingWarnings,
    requiresUserApproval: true,
  };
}

/**
 * Build call transaction preview
 */
function buildCallPreview(
  intent: {
    type: 'call';
    contract: string;
    method: string;
    args: Record<string, unknown>;
    gas?: string;
    deposit?: string;
  },
  network: 'testnet' | 'mainnet',
  existingWarnings: string[]
): TransactionPreview {
  const transaction: NearTransaction = {
    receiverId: intent.contract,
    actions: [
      {
        kind: 'FunctionCall',
        methodName: intent.method,
        args: intent.args,
        gas: intent.gas || '300000000000000',
        deposit: intent.deposit || '0',
      }
    ]
  };

  const description = `Call ${intent.method}() on ${intent.contract}`;
  const costDescription = [];
  if (intent.deposit && intent.deposit !== '0') {
    costDescription.push(`${parseInt(intent.deposit) / 1e24} NEAR attached`);
  }
  costDescription.push('gas fees');
  const estimatedCost = costDescription.join(' + ');

  return {
    intent,
    description,
    network,
    transactions: [transaction],
    estimatedGasNear: intent.gas 
      ? `${parseInt(intent.gas) / 1e12} NEAR` 
      : '0.003',
    estimatedTotalCostNear: estimatedCost,
    warnings: existingWarnings,
    requiresUserApproval: true,
  };
}

/**
 * Build create account transaction preview
 */
function buildCreateAccountPreview(
  intent: {
    type: 'create_account';
    accountId: string;
    publicKey: string;
    initialBalance?: string;
  },
  network: 'testnet' | 'mainnet',
  existingWarnings: string[]
): TransactionPreview {
  const initialBalanceYocto = intent.initialBalance
    ? parseAmountToYocto(intent.initialBalance)
    : '5000000000000000000000000'; // 5 NEAR default

  const actions: TransactionAction[] = [
    {
      kind: 'FunctionCall',
      methodName: 'create_account',
      args: {
        new_account_id: intent.accountId,
        new_public_key: intent.publicKey,
      },
      gas: '100000000000000',
      deposit: initialBalanceYocto,
    }
  ];

  const transaction: NearTransaction = {
    receiverId: 'testnet' in intent ? 'testnet' : 'near', // Use implicit account or registrar
    actions,
  };

  return {
    intent,
    description: `Create account ${intent.accountId} with ${intent.initialBalance || '5'} NEAR initial balance`,
    network,
    transactions: [transaction],
    estimatedGasNear: '0.0001',
    estimatedTotalCostNear: `${intent.initialBalance || '5'} NEAR + fees`,
    warnings: existingWarnings,
    requiresUserApproval: true,
  };
}

/**
 * Parse amount string to yoctoNEAR (10^-24 NEAR)
 * Handles decimal amounts by converting to smallest unit
 */
function parseAmountToYocto(amountStr: string): string {
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) {
    return '0';
  }
  
  // Convert to yoctoNEAR (multiply by 10^24)
  const yoctoNear = BigInt(Math.floor(amount * 1e24));
  return yoctoNear.toString();
}

/**
 * Calculate minimum amount out based on slippage tolerance
 * @param amountStr - Input amount
 * @param slippageBps - Slippage tolerance in basis points (100 = 1%)
 * @returns Minimum amount out as string
 */
function calculateMinAmountOut(amountStr: string, slippageBps: number): string {
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) {
    return '0';
  }
  
  const minAmount = amount * (1 - slippageBps / 10000);
  return Math.floor(minAmount * 1e24).toString();
}

/**
 * Check if an intent requires user approval before execution
 * This is a policy decision - high-value or irreversible operations require approval
 */
export function requiresApproval(intent: NearIntent): boolean {
  switch (intent.type) {
    case 'swap':
      // Swaps with high value or high slippage require approval
      const amount = parseFloat(intent.amount);
      return amount > 100 || (intent.slippageBps ?? 0) > 300; // >100 NEAR or >3% slippage
    
    case 'stake':
    case 'unstake':
      // Staking operations always require approval (locking funds)
      return true;
    
    case 'transfer':
      // Large transfers require approval
      const transferAmount = parseFloat(intent.amount);
      return transferAmount > 50;
    
    case 'call':
      // Contract calls with deposit require approval
      const deposit = intent.deposit ? BigInt(intent.deposit) : 0n;
      return deposit > 0n;
    
    case 'create_account':
      // Creating accounts always requires approval
      return true;
    
    default:
      return false;
  }
}
