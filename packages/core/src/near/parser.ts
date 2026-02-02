/**
 * NEAR Intent Parser
 * 
 * Parses natural language input into structured NEAR intents.
 * Framework-agnostic - no React dependencies.
 * 
 * In production, this would use an LLM for more sophisticated parsing.
 * Current implementation uses pattern matching for demonstration.
 */

import type {
  NearIntent,
  ParseResult,
  TransferIntent,
  SwapIntent,
  StakeIntent,
} from './types.js';

/**
 * Parse natural language into a NEAR intent
 * 
 * @param text - Natural language input (e.g., "Swap 1 NEAR for USDC on Ref Finance")
 * @returns Parse result with intent, confidence, and any warnings
 */
export function parseIntent(text: string): ParseResult {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return {
      intent: null,
      confidence: 0,
      warnings: [],
      missingFields: [],
    };
  }

  const lowerInput = trimmed.toLowerCase();

  // Try to match specific intent patterns
  if (lowerInput.includes('swap') || lowerInput.includes('trade') || lowerInput.includes('exchange')) {
    return parseSwapIntent(trimmed, lowerInput);
  }

  if (lowerInput.includes('stake') || lowerInput.includes('deposit')) {
    return parseStakeIntent(trimmed, lowerInput);
  }

  if (lowerInput.includes('unstake') || lowerInput.includes('withdraw')) {
    return parseUnstakeIntent(trimmed, lowerInput);
  }

  if (lowerInput.includes('transfer') || lowerInput.includes('send') || lowerInput.includes('pay')) {
    return parseTransferIntent(trimmed, lowerInput);
  }

  if (lowerInput.includes('call') || lowerInput.includes('invoke')) {
    return parseCallIntent(trimmed, lowerInput);
  }

  if (lowerInput.includes('create') && lowerInput.includes('account')) {
    return parseCreateAccountIntent(trimmed, lowerInput);
  }

  // No pattern matched
  return {
    intent: null,
    confidence: 0,
    warnings: ['Could not identify intent type. Try using keywords like "swap", "stake", "transfer", etc.'],
    missingFields: [],
  };
}

/**
 * Parse a swap intent
 * Examples: "Swap 1 NEAR for USDC", "Trade 5 NEAR for USDT on Ref Finance"
 */
function parseSwapIntent(text: string, lowerInput: string): ParseResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];
  let confidence = 0.8;

  // Extract amount
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*near/i);
  const amount = amountMatch?.[1] || '1';

  // Extract target token
  let toToken = 'usdc.fakes.testnet';
  if (lowerInput.includes('usdt')) {
    toToken = 'usdt.fakes.testnet';
  } else if (lowerInput.includes('dai')) {
    toToken = 'dai.fakes.testnet';
  } else if (lowerInput.includes('usdc')) {
    toToken = 'usdc.fakes.testnet';
  }

  // Extract protocol
  let protocol: string | undefined;
  if (lowerInput.includes('ref finance') || lowerInput.includes('ref.finance')) {
    protocol = 'ref.finance';
  }

  // Check for slippage specification
  const slippageMatch = text.match(/(\d+(?:\.\d+)?)%?\s*slippage/i);
  let slippageBps: number | undefined;
  if (slippageMatch) {
    slippageBps = Math.round(parseFloat(slippageMatch[1]) * 100);
  } else {
    warnings.push('No slippage tolerance specified. Default policy may reject execution.');
    missingFields.push('slippageBps');
  }

  const intent: SwapIntent = {
    type: 'swap',
    fromToken: 'NEAR',
    toToken,
    amount,
    protocol,
    slippageBps,
  };

  return {
    intent,
    confidence,
    warnings,
    missingFields,
  };
}

/**
 * Parse a stake intent
 * Examples: "Stake 5 NEAR with pool.testnet", "Stake 10 NEAR"
 */
function parseStakeIntent(text: string, lowerInput: string): ParseResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Extract amount
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*near/i);
  let amount = amountMatch?.[1];

  if (!amount) {
    // Try to find amount anywhere in text
    const anyAmountMatch = text.match(/(\d+(?:\.\d+)?)/);
    amount = anyAmountMatch?.[1] || '0';
  }

  // Extract validator
  const validatorMatch = text.match(/(?:with|to|validator|pool)\s+([a-z0-9._-]+\.near|[a-z0-9._-]+)/i);
  const validator = validatorMatch?.[1] || 'pool.f863973.m0';

  if (!validatorMatch) {
    warnings.push('No validator specified. Using default validator.');
    missingFields.push('validator');
  }

  const intent: StakeIntent = {
    type: 'stake',
    validator,
    amount,
  };

  return {
    intent,
    confidence: 0.85,
    warnings,
    missingFields,
  };
}

/**
 * Parse an unstake intent
 * Examples: "Unstake 5 NEAR from pool.testnet", "Unstake all"
 */
function parseUnstakeIntent(text: string, lowerInput: string): ParseResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Extract amount (optional for unstake)
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*near/i);
  const amount = amountMatch?.[1];

  // Check if "all" is specified
  const isAll = lowerInput.includes('all');
  if (!amount && !isAll) {
    warnings.push('No amount specified. Will unstake all available NEAR.');
  }

  // Extract validator
  const validatorMatch = text.match(/(?:from|validator|pool)\s+([a-z0-9._-]+\.near|[a-z0-9._-]+)/i);
  const validator = validatorMatch?.[1] || 'pool.f863973.m0';

  if (!validatorMatch) {
    warnings.push('No validator specified. Using default validator.');
    missingFields.push('validator');
  }

  const intent = {
    type: 'unstake' as const,
    validator,
    amount: isAll ? undefined : (amount || undefined),
  };

  return {
    intent,
    confidence: 0.85,
    warnings,
    missingFields,
  };
}

/**
 * Parse a transfer intent
 * Examples: "Transfer 1 NEAR to alice.testnet", "Send 2 NEAR to bob"
 */
function parseTransferIntent(text: string, lowerInput: string): ParseResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Extract amount
  const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(near|usdc|usdt|dai)/i);
  const amount = amountMatch?.[1] || '1';
  const token = amountMatch?.[2]?.toUpperCase() || 'NEAR';

  // Extract recipient
  const toMatch = text.match(/(?:to|recipient|account)\s+([a-z0-9._-]+(?:\.[a-z]+)?)/i);
  const to = toMatch?.[1];

  if (!to) {
    warnings.push('No recipient specified. Please provide an account ID.');
    missingFields.push('to');
  }

  const intent: TransferIntent = {
    type: 'transfer',
    token,
    amount,
    to: to || 'recipient.near',
  };

  return {
    intent,
    confidence: to ? 0.9 : 0.5,
    warnings,
    missingFields,
  };
}

/**
 * Parse a generic contract call intent
 * Examples: "Call method increment on counter.testnet"
 */
function parseCallIntent(text: string, lowerInput: string): ParseResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Extract contract
  const contractMatch = text.match(/(?:on|contract|account)\s+([a-z0-9._-]+\.near|[a-z0-9._-]+)/i);
  const contract = contractMatch?.[1];

  if (!contract) {
    missingFields.push('contract');
  }

  // Extract method
  const methodMatch = text.match(/(?:method|call|invoke)\s+([a-z_][a-z0-9_]*)/i);
  const method = methodMatch?.[1];

  if (!method) {
    missingFields.push('method');
  }

  const intent = {
    type: 'call' as const,
    contract: contract || 'contract.near',
    method: method || 'method_name',
    args: {},
  };

  return {
    intent,
    confidence: (contract ? 0.5 : 0) + (method ? 0.4 : 0),
    warnings,
    missingFields,
  };
}

/**
 * Parse a create account intent
 * Examples: "Create account newuser.near with public key ..."
 */
function parseCreateAccountIntent(text: string, lowerInput: string): ParseResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Extract account ID
  const accountMatch = text.match(/(?:account|create)\s+([a-z0-9._-]+\.near|[a-z0-9._-]+)/i);
  const accountId = accountMatch?.[1];

  if (!accountId) {
    missingFields.push('accountId');
  }

  // Extract public key
  const keyMatch = text.match(/(?:key|public key)\s+([a-z0-9]+)/i);
  const publicKey = keyMatch?.[1];

  if (!publicKey) {
    missingFields.push('publicKey');
  }

  // Extract initial balance
  const balanceMatch = text.match(/(\d+(?:\.\d+)?)\s*near/i);
  const initialBalance = balanceMatch?.[1];

  const intent = {
    type: 'create_account' as const,
    accountId: accountId || 'newaccount.near',
    publicKey: publicKey || '',
    initialBalance,
  };

  return {
    intent,
    confidence: (accountId ? 0.4 : 0) + (publicKey ? 0.5 : 0),
    warnings,
    missingFields,
  };
}

/**
 * Parse and validate in one step
 * 
 * @param text - Natural language input
 * @returns Parse result
 */
export function parseAndValidate(text: string): ParseResult {
  return parseIntent(text);
}
