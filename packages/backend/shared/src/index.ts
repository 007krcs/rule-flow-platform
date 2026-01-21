/**
 * Shared types for Rule Flow Platform
 * Used across all services
 */

// Core Rule Engine Types
export interface Rule {
  ruleId: string;
  name: string;
  description?: string;
  version: string;
  enabled: boolean;
  scope?: RuleScope;
  when: Condition;
  then: Action[];
  priority: number;
  stopOnMatch?: boolean;
  metadata?: Record<string, any>;
}

export interface RuleSet {
  ruleSetId: string;
  name: string;
  version: string;
  strategy: 'first-match' | 'all' | 'priority-order';
  enabled: boolean;
  rules: Rule[];
  metadata?: Record<string, any>;
}

export interface RuleScope {
  country?: string[];
  programId?: string[];
  issuerId?: string[];
  role?: string[];
  [key: string]: any;
}

export interface Condition {
  field?: string;
  op?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith' | 'matches';
  value?: any;
  all?: Condition[];
  any?: Condition[];
  not?: Condition;
}

export interface Action {
  type: 'set' | 'calculate' | 'append' | 'remove' | 'log';
  field?: string;
  value?: any;
  expression?: string;
}

export interface ExecutionContext {
  userRole: string;
  country: string;
  locale: string;
  deviceType: string;
  isMobile: boolean;
  programId?: string;
  issuerId?: string;
  permissions: string[];
  correlationId: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface RuleExecutionRequest {
  ruleSetId: string;
  context: ExecutionContext;
}

export interface RuleExecutionResult {
  success: boolean;
  data: Record<string, any>;
  metadata: {
    rulesMatched: string[];
    executionTimeMs: number;
    ruleSetVersion: string;
    correlationId: string;
  };
  errors?: Array<{
    message: string;
    code: string;
    field?: string;
  }>;
}

// Database models
export interface RuleSetRecord {
  id: string;
  ruleset_id: string;
  name: string;
  version: string;
  strategy: 'first-match' | 'all' | 'priority-order';
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RuleRecord {
  id: string;
  ruleset_id: string;
  rule_id: string;
  name: string;
  description?: string;
  condition: any; // JSONB
  actions: any[]; // JSONB
  scope?: any; // JSONB
  priority: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
