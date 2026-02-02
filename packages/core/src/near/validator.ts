/**
 * NEAR Intent Validator
 * 
 * Validates NEAR intent structure and required fields.
 * Framework-agnostic - no React dependencies.
 */

import type {
  NearIntent,
  ValidationResult,
} from './types.js';

/**
 * Validate a NEAR intent
 * 
 * @param intent - The intent to validate
 * @returns Validation result with errors and warnings
 */
export function validateIntent(intent: NearIntent | null): ValidationResult {
  if (!intent) {
    return {
      valid: false,
      errors: ['Intent is null or undefined'],
      warnings: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Common validation for all intent types
  if (!intent.type) {
    errors.push('Intent type is required');
    return { valid: false, errors, warnings };
  }

  // Type-specific validation
  switch (intent.type) {
    case 'transfer':
      validateTransfer(intent, errors, warnings);
      break;
    case 'swap':
      validateSwap(intent, errors, warnings);
      break;
    case 'stake':
      validateStake(intent, errors, warnings);
      break;
    case 'unstake':
      validateUnstake(intent, errors, warnings);
      break;
    case 'call':
      validateCall(intent, errors, warnings);
      break;
    case 'create_account':
      validateCreateAccount(intent, errors, warnings);
      break;
    default:
      errors.push(`Unknown intent type: ${(intent as { type: string }).type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate transfer intent
 */
function validateTransfer(
  intent: { type: 'transfer'; token: string; amount: string; to: string },
  errors: string[],
  warnings: string[]
): void {
  if (!intent.token?.trim()) {
    errors.push('Token is required for transfer');
  }

  if (!intent.amount?.trim()) {
    errors.push('Amount is required for transfer');
  } else {
    // Validate amount is a positive number
    const amount = parseFloat(intent.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    }
  }

  if (!intent.to?.trim()) {
    errors.push('Recipient address (to) is required for transfer');
  } else if (!isValidAccountId(intent.to)) {
    warnings.push('Recipient address may not be a valid NEAR account ID');
  }

  // Warn about common token mistakes
  const token = intent.token.toLowerCase();
  if (token === 'near' || token === 'wnear') {
    // Native token, no warning
  } else if (!token.includes('.') && !token.includes('-')) {
    warnings.push(`Token "${intent.token}" may not be a valid token contract ID`);
  }
}

/**
 * Validate swap intent
 */
function validateSwap(
  intent: {
    type: 'swap';
    fromToken: string;
    toToken: string;
    amount: string;
    protocol?: string;
    slippageBps?: number;
  },
  errors: string[],
  warnings: string[]
): void {
  if (!intent.fromToken?.trim()) {
    errors.push('Source token (fromToken) is required for swap');
  }

  if (!intent.toToken?.trim()) {
    errors.push('Target token (toToken) is required for swap');
  } else if (intent.toToken === intent.fromToken) {
    errors.push('Source and target tokens cannot be the same');
  }

  if (!intent.amount?.trim()) {
    errors.push('Amount is required for swap');
  } else {
    const amount = parseFloat(intent.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    }
  }

  if (!intent.protocol?.trim()) {
    warnings.push('No protocol specified. Will use default (ref.finance)');
  }

  if (intent.slippageBps === undefined) {
    warnings.push('No slippage tolerance specified. Execution may fail due to price movement.');
  } else if (intent.slippageBps < 0 || intent.slippageBps > 10000) {
    errors.push('Slippage tolerance must be between 0 and 10000 basis points (0-100%)');
  } else if (intent.slippageBps > 500) {
    warnings.push('Slippage tolerance is greater than 5%. You may experience significant slippage.');
  } else if (intent.slippageBps < 10) {
    warnings.push('Slippage tolerance is very low (<0.1%). Transaction may fail due to minor price movements.');
  }
}

/**
 * Validate stake intent
 */
function validateStake(
  intent: { type: 'stake'; validator: string; amount: string },
  errors: string[],
  warnings: string[]
): void {
  if (!intent.validator?.trim()) {
    errors.push('Validator is required for staking');
  } else if (!isValidAccountId(intent.validator)) {
    warnings.push('Validator address may not be a valid NEAR account ID or pool name');
  }

  if (!intent.amount?.trim()) {
    errors.push('Amount is required for staking');
  } else {
    const amount = parseFloat(intent.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    } else if (amount < 10) {
      warnings.push('Staking amount is less than 10 NEAR. Minimum stake may be higher depending on the pool.');
    }
  }
}

/**
 * Validate unstake intent
 */
function validateUnstake(
  intent: { type: 'unstake'; validator: string; amount?: string },
  errors: string[],
  warnings: string[]
): void {
  if (!intent.validator?.trim()) {
    errors.push('Validator is required for unstaking');
  } else if (!isValidAccountId(intent.validator)) {
    warnings.push('Validator address may not be a valid NEAR account ID or pool name');
  }

  // Amount is optional for unstake (can unstake all)
  if (intent.amount !== undefined && intent.amount !== '') {
    const amount = parseFloat(intent.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    }
  } else {
    warnings.push('No amount specified. Will attempt to unstake all available staked NEAR.');
  }
}

/**
 * Validate call intent
 */
function validateCall(
  intent: {
    type: 'call';
    contract: string;
    method: string;
    args: Record<string, unknown>;
    gas?: string;
    deposit?: string;
  },
  errors: string[],
  warnings: string[]
): void {
  if (!intent.contract?.trim()) {
    errors.push('Contract address is required for call');
  } else if (!isValidAccountId(intent.contract)) {
    warnings.push('Contract address may not be a valid NEAR account ID');
  }

  if (!intent.method?.trim()) {
    errors.push('Method name is required for call');
  } else if (!/^[a-z_][a-z0-9_]*$/.test(intent.method)) {
    errors.push('Method name must be a valid identifier (lowercase, underscores, alphanumeric)');
  }

  if (intent.args === null || intent.args === undefined) {
    warnings.push('No arguments provided for method call');
  }

  if (intent.gas !== undefined) {
    const gas = parseInt(intent.gas, 10);
    if (isNaN(gas) || gas <= 0) {
      errors.push('Gas must be a positive integer');
    } else if (gas > 300000000000000) {
      warnings.push('Gas limit is very high (>300 Tgas). This may exceed the block limit.');
    }
  }

  if (intent.deposit !== undefined) {
    // Deposit is in yoctoNEAR (10^-24 NEAR)
    const deposit = BigInt(intent.deposit || '0');
    if (deposit < 0) {
      errors.push('Deposit cannot be negative');
    }
  }
}

/**
 * Validate create account intent
 */
function validateCreateAccount(
  intent: {
    type: 'create_account';
    accountId: string;
    publicKey: string;
    initialBalance?: string;
  },
  errors: string[],
  warnings: string[]
): void {
  if (!intent.accountId?.trim()) {
    errors.push('Account ID is required for creating account');
  } else if (!isValidAccountId(intent.accountId)) {
    errors.push('Account ID must be a valid NEAR account ID (lowercase, ends with .near or valid suffix)');
  } else if (intent.accountId.length < 2) {
    errors.push('Account ID must be at least 2 characters long');
  } else if (intent.accountId.length > 64) {
    errors.push('Account ID must be at most 64 characters long');
  }

  if (!intent.publicKey?.trim()) {
    errors.push('Public key is required for creating account');
  } else if (!isValidPublicKey(intent.publicKey)) {
    errors.push('Public key must be a valid base58-encoded ED25519 or SECP256K1 key');
  }

  if (intent.initialBalance !== undefined && intent.initialBalance !== '') {
    const balance = parseFloat(intent.initialBalance);
    if (isNaN(balance) || balance <= 0) {
      errors.push('Initial balance must be a positive number');
    } else if (balance < 5) {
      warnings.push('Initial balance is less than 5 NEAR. Account may not have enough for storage costs.');
    }
  }
}

/**
 * Check if a string looks like a valid NEAR account ID
 * This is a basic check, not a comprehensive validation
 */
function isValidAccountId(accountId: string): boolean {
  if (!accountId || accountId.length > 64 || accountId.length < 2) {
    return false;
  }

  // NEAR account IDs are lowercase, can contain dashes, dots, and numbers
  // Must end with a valid suffix or be a top-level account
  const validPattern = /^[a-z0-9._-]+$/;
  if (!validPattern.test(accountId)) {
    return false;
  }

  // Cannot start or end with dot or dash
  if (accountId.startsWith('.') || accountId.endsWith('.')) {
    return false;
  }
  if (accountId.startsWith('-') || accountId.endsWith('-')) {
    return false;
  }

  // Cannot have consecutive dots or dashes
  if (/\.\.|--/.test(accountId)) {
    return false;
  }

  return true;
}

/**
 * Check if a string looks like a valid public key
 * This is a basic format check for base58-encoded keys
 */
function isValidPublicKey(publicKey: string): boolean {
  if (!publicKey || publicKey.length < 44 || publicKey.length > 88) {
    return false;
  }

  // Base58 character set
  const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Pattern.test(publicKey);
}
