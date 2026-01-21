import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine } from './rule-engine';
import type { RuleExecutionRequest, ExecutionContext } from './types';

describe('RuleEngine', () => {
  let engine: RuleEngine;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    engine = new RuleEngine();
    mockContext = {
      userRole: 'ADMIN',
      country: 'DE',
      locale: 'de-DE',
      deviceType: 'WEB',
      isMobile: false,
      programId: '123',
      issuerId: 'ISSUER_001',
      permissions: ['TRADE_EDIT'],
      correlationId: 'test-correlation-id',
      timestamp: Date.now(),
      data: {}
    };
  });

  describe('Simple Conditions', () => {
    it('should match equals condition', () => {
      const condition = {
        field: 'currency',
        op: 'eq' as const,
        value: 'EUR'
      };
      
      const data = { currency: 'EUR' };
      const result = engine['evaluateSimpleCondition'](condition, data, mockContext);
      
      expect(result).toBe(true);
    });

    it('should not match equals condition with different value', () => {
      const condition = {
        field: 'currency',
        op: 'eq' as const,
        value: 'EUR'
      };
      
      const data = { currency: 'USD' };
      const result = engine['evaluateSimpleCondition'](condition, data, mockContext);
      
      expect(result).toBe(false);
    });

    it('should match greater than condition', () => {
      const condition = {
        field: 'amount',
        op: 'gt' as const,
        value: 10000
      };
      
      const data = { amount: 15000 };
      const result = engine['evaluateSimpleCondition'](condition, data, mockContext);
      
      expect(result).toBe(true);
    });

    it('should match in operator', () => {
      const condition = {
        field: 'status',
        op: 'in' as const,
        value: ['PENDING', 'APPROVED']
      };
      
      const data = { status: 'PENDING' };
      const result = engine['evaluateSimpleCondition'](condition, data, mockContext);
      
      expect(result).toBe(true);
    });
  });

  describe('Complex Conditions', () => {
    it('should match ALL conditions', () => {
      const condition = {
        all: [
          { field: 'currency', op: 'eq' as const, value: 'EUR' },
          { field: 'amount', op: 'gt' as const, value: 10000 }
        ]
      };
      
      const data = { currency: 'EUR', amount: 15000 };
      const result = engine['evaluateComplexCondition'](condition, data, mockContext);
      
      expect(result).toBe(true);
    });

    it('should fail if ANY condition in ALL fails', () => {
      const condition = {
        all: [
          { field: 'currency', op: 'eq' as const, value: 'EUR' },
          { field: 'amount', op: 'gt' as const, value: 10000 }
        ]
      };
      
      const data = { currency: 'USD', amount: 15000 };
      const result = engine['evaluateComplexCondition'](condition, data, mockContext);
      
      expect(result).toBe(false);
    });

    it('should match ANY conditions', () => {
      const condition = {
        any: [
          { field: 'currency', op: 'eq' as const, value: 'EUR' },
          { field: 'currency', op: 'eq' as const, value: 'USD' }
        ]
      };
      
      const data = { currency: 'USD' };
      const result = engine['evaluateComplexCondition'](condition, data, mockContext);
      
      expect(result).toBe(true);
    });
  });

  describe('Actions', () => {
    it('should execute SET action', async () => {
      const actions = [
        { type: 'set' as const, field: 'paymentTerm', value: 30 }
      ];
      
      const data = { paymentTerm: 20 };
      await engine['executeActions'](actions, data, mockContext);
      
      expect(data.paymentTerm).toBe(30);
    });

    it('should execute APPEND action', async () => {
      const actions = [
        { type: 'append' as const, field: 'flags', value: 'HIGH_RISK' }
      ];
      
      const data = { flags: ['EXISTING_FLAG'] };
      await engine['executeActions'](actions, data, mockContext);
      
      expect(data.flags).toContain('HIGH_RISK');
      expect(data.flags).toHaveLength(2);
    });

    it('should execute REMOVE action', async () => {
      const actions = [
        { type: 'remove' as const, field: 'tempData' }
      ];
      
      const data = { tempData: 'value', keepData: 'keep' };
      await engine['executeActions'](actions, data, mockContext);
      
      expect(data.tempData).toBeUndefined();
      expect(data.keepData).toBe('keep');
    });
  });

  describe('Scope Filtering', () => {
    it('should filter rules by country', () => {
      const rules = [
        {
          ruleId: 'R1',
          name: 'Rule 1',
          version: '1.0',
          enabled: true,
          scope: { country: ['DE', 'FR'] },
          when: { field: 'test', op: 'eq' as const, value: 'test' },
          then: [],
          priority: 10
        },
        {
          ruleId: 'R2',
          name: 'Rule 2',
          version: '1.0',
          enabled: true,
          scope: { country: ['US'] },
          when: { field: 'test', op: 'eq' as const, value: 'test' },
          then: [],
          priority: 10
        }
      ];

      const context = { ...mockContext, country: 'DE' };
      const filtered = engine['filterRulesByScope'](rules, context);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].ruleId).toBe('R1');
    });

    it('should filter rules by programId', () => {
      const rules = [
        {
          ruleId: 'R1',
          name: 'Rule 1',
          version: '1.0',
          enabled: true,
          scope: { programId: ['123'] },
          when: { field: 'test', op: 'eq' as const, value: 'test' },
          then: [],
          priority: 10
        }
      ];

      const context = { ...mockContext, programId: '123' };
      const filtered = engine['filterRulesByScope'](rules, context);
      
      expect(filtered).toHaveLength(1);
    });
  });

  describe('Priority Ordering', () => {
    it('should sort rules by priority descending', () => {
      const rules = [
        {
          ruleId: 'R1',
          name: 'Low Priority',
          version: '1.0',
          enabled: true,
          when: { field: 'test', op: 'eq' as const, value: 'test' },
          then: [],
          priority: 5
        },
        {
          ruleId: 'R2',
          name: 'High Priority',
          version: '1.0',
          enabled: true,
          when: { field: 'test', op: 'eq' as const, value: 'test' },
          then: [],
          priority: 20
        }
      ];

      const sorted = engine['sortRulesByPriority'](rules);
      
      expect(sorted[0].priority).toBe(20);
      expect(sorted[1].priority).toBe(5);
    });
  });

  describe('Nested Field Access', () => {
    it('should get nested field value', () => {
      const data = {
        customer: {
          address: {
            country: 'DE'
          }
        }
      };

      const value = engine['getNestedValue'](data, 'customer.address.country');
      expect(value).toBe('DE');
    });

    it('should set nested field value', () => {
      const data: any = {};
      
      engine['setFieldValue']('customer.address.country', 'DE', data);
      
      expect(data.customer.address.country).toBe('DE');
    });
  });
});
