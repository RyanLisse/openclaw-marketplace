/**
 * NEAR Intent Parser Tests
 */

import { parseIntent } from './parser.js';

describe('parseIntent', () => {
  describe('swap intents', () => {
    it('should parse a simple swap intent', () => {
      const result = parseIntent('Swap 1 NEAR for USDC');
      
      expect(result.intent).toBeTruthy();
      expect(result.intent?.type).toBe('swap');
      expect(result.intent).toMatchObject({
        type: 'swap',
        fromToken: 'NEAR',
        toToken: 'usdc.fakes.testnet',
        amount: '1',
      });
    });

    it('should parse swap with protocol', () => {
      const result = parseIntent('Swap 5 NEAR for USDT on Ref Finance');
      
      expect(result.intent).toBeTruthy();
      expect(result.intent?.type).toBe('swap');
      expect(result.intent).toMatchObject({
        type: 'swap',
        protocol: 'ref.finance',
        toToken: 'usdt.fakes.testnet',
        amount: '5',
      });
    });

    it('should parse swap with slippage', () => {
      const result = parseIntent('Swap 10 NEAR for DAI with 1% slippage');
      
      expect(result.intent).toBeTruthy();
      expect(result.intent?.type).toBe('swap');
      expect(result.intent).toMatchObject({
        type: 'swap',
        toToken: 'dai.fakes.testnet',
        amount: '10',
        slippageBps: 100, // 1% = 100 basis points
      });
    });
  });

  describe('stake intents', () => {
    it('should parse a simple stake intent', () => {
      const result = parseIntent('Stake 5 NEAR with pool.testnet');
      
      expect(result.intent).toBeTruthy();
      expect(result.intent?.type).toBe('stake');
      expect(result.intent).toMatchObject({
        type: 'stake',
        validator: 'pool.testnet',
        amount: '5',
      });
    });

    it('should use default validator when not specified', () => {
      const result = parseIntent('Stake 10 NEAR');
      
      expect(result.intent).toBeTruthy();
      expect(result.intent?.type).toBe('stake');
      expect(result.intent).toMatchObject({
        type: 'stake',
        amount: '10',
      });
    });
  });

  describe('transfer intents', () => {
    it('should parse a transfer intent', () => {
      const result = parseIntent('Transfer 2 NEAR to alice.testnet');
      
      expect(result.intent).toBeTruthy();
      expect(result.intent?.type).toBe('transfer');
      expect(result.intent).toMatchObject({
        type: 'transfer',
        token: 'NEAR',
        amount: '2',
        to: 'alice.testnet',
      });
    });

    it('should parse "send" as transfer', () => {
      const result = parseIntent('Send 5 NEAR to bob.testnet');
      
      expect(result.intent).toBeTruthy();
      expect(result.intent?.type).toBe('transfer');
    });
  });

  describe('unknown intents', () => {
    it('should return null intent for unrecognised input', () => {
      const result = parseIntent('Hello world');
      
      expect(result.intent).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
