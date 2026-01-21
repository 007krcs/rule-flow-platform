import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuleFlowSDK, createRuleFlowSDK } from './index';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('RuleFlowSDK', () => {
  let sdk: RuleFlowSDK;
  const mockConfig = {
    apiUrl: 'http://localhost:3003',
    apiKey: 'test-key'
  };

  beforeEach(() => {
    sdk = new RuleFlowSDK(mockConfig);
    vi.clearAllMocks();
  });

  describe('executeRules', () => {
    it('should execute rules successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { paymentTerm: 30 },
          metadata: { rulesMatched: 1 }
        }
      };

      (axios.create as any).mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await sdk.executeRules({
        ruleSetId: 'TEST_RULES',
        context: {
          userRole: 'ADMIN',
          country: 'DE',
          programId: '123'
        },
        data: { amount: 15000, currency: 'EUR' }
      });

      expect(result.success).toBe(true);
      expect(result.data.paymentTerm).toBe(30);
    });

    it('should handle errors gracefully', async () => {
      (axios.create as any).mockReturnValue({
        post: vi.fn().mockRejectedValue(new Error('Network error'))
      });

      await expect(
        sdk.executeRules({
          ruleSetId: 'TEST_RULES',
          context: { userRole: 'ADMIN', country: 'DE' }
        })
      ).rejects.toThrow('Rule execution failed');
    });
  });

  describe('executePeculiarities', () => {
    it('should execute peculiarity processing', async () => {
      const mockResponse = {
        data: {
          success: true,
          peculiarities: { paymentTerm: 30 }
        }
      };

      (axios.create as any).mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await sdk.executePeculiarities({
        tradeId: 'T-123',
        programId: '123',
        issuerId: 'ISSUER_001'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getRuleSets', () => {
    it('should fetch rulesets', async () => {
      const mockResponse = {
        data: {
          data: [
            { ruleSetId: 'RULES_1', name: 'Test Rules' }
          ]
        }
      };

      (axios.create as any).mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse)
      });

      const rulesets = await sdk.getRuleSets();
      expect(rulesets).toHaveLength(1);
      expect(rulesets[0].ruleSetId).toBe('RULES_1');
    });
  });

  describe('createRuleFlowSDK', () => {
    it('should create SDK instance', () => {
      const instance = createRuleFlowSDK(mockConfig);
      expect(instance).toBeInstanceOf(RuleFlowSDK);
    });
  });
});
