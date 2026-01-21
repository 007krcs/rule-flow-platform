/**
 * Core type definitions for Rule Engine
 * Based on architecture diagrams and requirements
 */

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

export interface ExecutionContext {
  // User Context
  userId?: string;
  userRole: string;
  permissions: string[];
  organizationId?: string;

  // Geographic Context
  country: string;
  region?: string;
  locale: string;
  timezone?: string;

  // Device Context
  deviceType: 'WEB' | 'MOBILE' | 'TABLET' | 'EMBEDDED' | 'API';
  userAgent?: string;
  isMobile: boolean;

  // Business Context (Program/Issuer from architecture)
  programId?: string;
  issuerId?: string;
  customerId?: string;

  // Data being processed
  data: Record<string, any>;

  // Execution Metadata
  correlationId: string;
  sessionId?: string;
  timestamp: number;

  // Feature Flags
  featureFlags?: Record<string, boolean>;
}

// ============================================================================
// RULE DEFINITIONS
// ============================================================================

export type RuleOperator =
  | 'eq'    // equals
  | 'ne'    // not equals
  | 'gt'    // greater than
  | 'gte'   // greater than or equal
  | 'lt'    // less than
  | 'lte'   // less than or equal
  | 'in'    // in array
  | 'nin'   // not in array
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'matches'; // regex

export interface SimpleCondition {
  field: string;
  op: RuleOperator;
  value: any;
}

export interface ComplexCondition {
  all?: Condition[];  // AND
  any?: Condition[];  // OR
  not?: Condition;    // NOT
}

export type Condition = SimpleCondition | ComplexCondition;

export interface RuleAction {
  type: 'set' | 'append' | 'remove' | 'calculate' | 'call';
  field?: string;
  value?: any;
  expression?: string;  // MVEL expression
  function?: string;    // Function to call
  params?: any[];
}

export interface RuleScope {
  programId?: string[];
  issuerId?: string[];
  country?: string[];
  role?: string[];
  organizationId?: string[];
}

export interface Rule {
  ruleId: string;
  name: string;
  description?: string;
  version: string;
  enabled: boolean;
  
  // Scope - when this rule applies
  scope?: RuleScope;
  
  // Condition - when to execute
  when: Condition;
  
  // Actions - what to do
  then: RuleAction[];
  
  // Execution control
  priority: number;  // Higher = earlier execution
  stopOnMatch?: boolean;  // Stop evaluating further rules
  
  // Metadata
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  tags?: string[];
}

export interface RuleSet {
  ruleSetId: string;
  name: string;
  description?: string;
  version: string;
  rules: Rule[];
  
  // Execution strategy
  strategy: 'first-match' | 'all' | 'priority-order';
  
  // Metadata
  country?: string[];
  programId?: string[];
  issuerId?: string[];
}

// ============================================================================
// RULE EXECUTION
// ============================================================================

export interface RuleExecutionRequest {
  ruleSetId: string;
  context: ExecutionContext;
  data?: Record<string, any>;  // Optional, can use context.data
}

export interface RuleExecutionResult {
  success: boolean;
  data: Record<string, any>;  // Modified data
  executionTrace: RuleExecutionTrace[];
  errors?: RuleExecutionError[];
  metadata: {
    executionTimeMs: number;
    rulesEvaluated: number;
    rulesMatched: number;
    correlationId: string;
  };
}

export interface RuleExecutionTrace {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  executionTimeMs: number;
  conditionResult?: boolean;
  actionsExecuted?: number;
  error?: string;
}

export interface RuleExecutionError {
  ruleId: string;
  error: string;
  stack?: string;
  timestamp: number;
}

// ============================================================================
// RULE STORAGE
// ============================================================================

export interface RuleStorageAdapter {
  getRuleSet(ruleSetId: string): Promise<RuleSet | null>;
  getRuleSetsByScope(scope: Partial<RuleScope>): Promise<RuleSet[]>;
  saveRuleSet(ruleSet: RuleSet): Promise<void>;
  updateRule(ruleSetId: string, rule: Rule): Promise<void>;
  deleteRule(ruleSetId: string, ruleId: string): Promise<void>;
}

// ============================================================================
// EXPRESSION EVALUATOR
// ============================================================================

export interface ExpressionEvaluator {
  evaluate(expression: string, context: Record<string, any>): any;
  isValid(expression: string): boolean;
}

// ============================================================================
// API CONTRACTS (from architecture diagram)
// ============================================================================

export interface RulesEngineAPIRequest {
  ruleSetId: string;
  identifier: string;  // Map for DSL/MVEL resolver
  dataset: Record<string, any>;  // Dataset to apply rules to
}

export interface RulesEngineAPIResponse {
  success: boolean;
  dataset: Record<string, any>;  // Modified dataset
  rulesApplied: string[];
  executionTimeMs: number;
}

// From Peculiarity Execution Gateway flow
export interface PeculiarityExecutionRequest {
  tradeId: string;
  programId: string;
  issuerId: string;
  data: Record<string, any>;
  ruleSubset?: string;  // Different Rulesets for different Program/Issuer combos
}

export interface PeculiarityExecutionResponse {
  tradeId: string;
  peculiarities: Record<string, any>;
  updatedData: Record<string, any>;
  success: boolean;
}
