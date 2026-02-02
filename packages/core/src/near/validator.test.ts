/**
 * NEAR Intent Validator Tests
 */

import { validateIntent } from './validator.js';
import type { SwapIntent, TransferIntent, StakeIntent } from './types.js';

describe('validateIntent', () => {
  describe('swap validation', () => {
    it('should validate a correct swap intent', () => {
      const intent: SwapIntent = {
        type: 'swap',
        fromToken: 'NEAR',
        toToken: 'usdc.fakes.testnet',
        amount: '10',
        protocol: 'ref.finance',
        slippageBps: 100,
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when slippage is not specified', () => {
      const intent: SwapIntent = {
        type: 'swap',
        fromToken: 'NEAR',
        toToken: 'usdc.fakes.testnet',
        amount: '10',
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No slippage tolerance specified. Execution may fail due to price movement.');
    });

    it('should warn when slippage is very high', () => {
      const intent: SwapIntent = {
        type: 'swap',
        fromToken: 'NEAR',
        toToken: 'usdc.fakes.testnet',
        amount: '10',
        slippageBps: 1000, // 10%
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('greater than 5%'))).toBe(true);
    });

    it('should error when source equals target token', () => {
      const intent: SwapIntent = {
        type: 'swap',
        fromToken: 'NEAR',
        toToken: 'NEAR',
        amount: '10',
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Source and target tokens cannot be the same');
    });
  });

  describe('transfer validation', () => {
    it('should validate a correct transfer intent', () => {
      const intent: TransferIntent = {
        type: 'transfer',
        token: 'NEAR',
        amount: '5',
        to: 'alice.testnet',
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should error when amount is missing', () => {
      const intent: TransferIntent = {
        type: 'transfer',
        token: 'NEAR',
        amount: '',
        to: 'alice.testnet',
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount is required for transfer');
    });

    it('should error when recipient is missing', () => {
      const intent: TransferIntent = {
        type: 'transfer',
        token: 'NEAR',
        amount: '5',
        to: '',
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Recipient address (to) is required for transfer');
    });
  });

  describe('stake validation', () => {
    it('should validate a correct stake intent', () => {
      const intent: StakeIntent = {
        type: 'stake',
        validator: 'pool.f863973.m0',
        amount: '50',
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when staking less than 10 NEAR', () => {
      const intent: StakeIntent = {
        type: 'stake',
        validator: 'pool.f863973.m0',
        amount: '5',
      };
      
      const result = validateIntent(intent);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('less than 10 NEAR'))).toBe(true);
    });
  });

  describe('null intent', () => {
    it('should return error for null intent', () => {
      const result = validateIntent(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Intent is null or undefined');
    });
  });
});
