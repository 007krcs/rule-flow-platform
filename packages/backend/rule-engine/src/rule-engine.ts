/**
 * Core Rule Engine
 * Evaluates rules against execution context and data
 * Based on architecture: Rules Engine API (Shared Service)
 */

import {
  Rule,
  RuleSet,
  ExecutionContext,
  RuleExecutionRequest,
  RuleExecutionResult,
  RuleExecutionTrace,
  Condition,
  SimpleCondition,
  ComplexCondition,
  RuleAction,
} from './types';
import { ExpressionEvaluatorImpl } from './expression-evaluator';
import { Logger } from './logger';

export class RuleEngine {
  private expressionEvaluator: ExpressionEvaluatorImpl;
  private logger: Logger;

  constructor() {
    this.expressionEvaluator = new ExpressionEvaluatorImpl();
    this.logger = new Logger('RuleEngine');
  }

  /**
   * Execute a ruleset against context and data
   * Main entry point matching architecture diagram
   */
  async execute(request: RuleExecutionRequest): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    const { context, data: requestData } = request;
    
    // Use data from request or context
    const data = { ...context.data, ...requestData };
    const executionTrace: RuleExecutionTrace[] = [];
    const errors: any[] = [];

    this.logger.info(`Executing ruleset: ${request.ruleSetId}`, {
      correlationId: context.correlationId,
    });

    try {
      // 1. Load ruleset from storage (would be DB in production)
      const ruleSet = await this.loadRuleSet(request.ruleSetId, context);
      
      if (!ruleSet) {
        throw new Error(`RuleSet not found: ${request.ruleSetId}`);
      }

      // 2. Filter rules by scope
      const applicableRules = this.filterRulesByScope(ruleSet.rules, context);
      
      // 3. Sort by priority (higher first)
      const sortedRules = this.sortRulesByPriority(applicableRules);

      this.logger.debug(`Found ${sortedRules.length} applicable rules`);

      // 4. Execute rules based on strategy
      let rulesMatched = 0;
      
      for (const rule of sortedRules) {
        const ruleStartTime = Date.now();
        
        try {
          // Evaluate condition
          const conditionResult = this.evaluateCondition(rule.when, data, context);
          
          const trace: RuleExecutionTrace = {
            ruleId: rule.ruleId,
            ruleName: rule.name,
            matched: conditionResult,
            executionTimeMs: Date.now() - ruleStartTime,
            conditionResult,
          };

          if (conditionResult) {
            // Execute actions
            const actionsExecuted = await this.executeActions(rule.then, data, context);
            trace.actionsExecuted = actionsExecuted;
            rulesMatched++;

            this.logger.debug(`Rule matched and executed: ${rule.ruleId}`);

            // Stop if configured
            if (rule.stopOnMatch || ruleSet.strategy === 'first-match') {
              executionTrace.push(trace);
              break;
            }
          }

          executionTrace.push(trace);

        } catch (error: any) {
          this.logger.error(`Error executing rule: ${rule.ruleId}`, error);
          errors.push({
            ruleId: rule.ruleId,
            error: error.message,
            stack: error.stack,
            timestamp: Date.now(),
          });
          
          executionTrace.push({
            ruleId: rule.ruleId,
            ruleName: rule.name,
            matched: false,
            executionTimeMs: Date.now() - ruleStartTime,
            error: error.message,
          });
        }
      }

      const result: RuleExecutionResult = {
        success: errors.length === 0,
        data,
        executionTrace,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          rulesEvaluated: sortedRules.length,
          rulesMatched,
          correlationId: context.correlationId,
        },
      };

      this.logger.info(`Ruleset execution completed`, {
        correlationId: context.correlationId,
        rulesMatched,
        executionTimeMs: result.metadata.executionTimeMs,
      });

      return result;

    } catch (error: any) {
      this.logger.error('Fatal error during rule execution', error);
      
      return {
        success: false,
        data,
        executionTrace,
        errors: [{
          ruleId: 'SYSTEM',
          error: error.message,
          stack: error.stack,
          timestamp: Date.now(),
        }],
        metadata: {
          executionTimeMs: Date.now() - startTime,
          rulesEvaluated: 0,
          rulesMatched: 0,
          correlationId: context.correlationId,
        },
      };
    }
  }

  /**
   * Evaluate a condition (simple or complex)
   */
  private evaluateCondition(
    condition: Condition,
    data: Record<string, any>,
    context: ExecutionContext
  ): boolean {
    if (this.isSimpleCondition(condition)) {
      return this.evaluateSimpleCondition(condition, data, context);
    }
    
    return this.evaluateComplexCondition(condition, data, context);
  }

  /**
   * Evaluate simple condition: field op value
   */
  private evaluateSimpleCondition(
    condition: SimpleCondition,
    data: Record<string, any>,
    context: ExecutionContext
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, data, context);
    const compareValue = condition.value;

    switch (condition.op) {
      case 'eq':
        return fieldValue === compareValue;
      case 'ne':
        return fieldValue !== compareValue;
      case 'gt':
        return fieldValue > compareValue;
      case 'gte':
        return fieldValue >= compareValue;
      case 'lt':
        return fieldValue < compareValue;
      case 'lte':
        return fieldValue <= compareValue;
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      case 'nin':
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'startsWith':
        return String(fieldValue).startsWith(String(compareValue));
      case 'endsWith':
        return String(fieldValue).endsWith(String(compareValue));
      case 'matches':
        return new RegExp(compareValue).test(String(fieldValue));
      default:
        throw new Error(`Unknown operator: ${condition.op}`);
    }
  }

  /**
   * Evaluate complex condition: all/any/not
   */
  private evaluateComplexCondition(
    condition: ComplexCondition,
    data: Record<string, any>,
    context: ExecutionContext
  ): boolean {
    if (condition.all) {
      return condition.all.every(c => this.evaluateCondition(c, data, context));
    }
    
    if (condition.any) {
      return condition.any.some(c => this.evaluateCondition(c, data, context));
    }
    
    if (condition.not) {
      return !this.evaluateCondition(condition.not, data, context);
    }
    
    return false;
  }

  /**
   * Execute rule actions
   */
  private async executeActions(
    actions: RuleAction[],
    data: Record<string, any>,
    context: ExecutionContext
  ): Promise<number> {
    let executed = 0;

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'set':
            if (action.field && action.value !== undefined) {
              this.setFieldValue(action.field, action.value, data);
              executed++;
            } else if (action.field && action.expression) {
              const value = this.expressionEvaluator.evaluate(
                action.expression,
                { ...data, ...context }
              );
              this.setFieldValue(action.field, value, data);
              executed++;
            }
            break;

          case 'append':
            if (action.field && action.value !== undefined) {
              const current = this.getFieldValue(action.field, data, context);
              if (Array.isArray(current)) {
                current.push(action.value);
                executed++;
              }
            }
            break;

          case 'remove':
            if (action.field) {
              delete data[action.field];
              executed++;
            }
            break;

          case 'calculate':
            if (action.field && action.expression) {
              const value = this.expressionEvaluator.evaluate(
                action.expression,
                { ...data, ...context }
              );
              this.setFieldValue(action.field, value, data);
              executed++;
            }
            break;

          case 'call':
            // Call external function (implement based on needs)
            this.logger.warn('Function call actions not yet implemented');
            break;
        }
      } catch (error: any) {
        this.logger.error(`Error executing action: ${action.type}`, error);
        throw error;
      }
    }

    return executed;
  }

  /**
   * Filter rules by scope (Program, Issuer, Country, Role)
   */
  private filterRulesByScope(rules: Rule[], context: ExecutionContext): Rule[] {
    return rules.filter(rule => {
      if (!rule.enabled) return false;
      if (!rule.scope) return true;

      const { scope } = rule;

      // Check programId
      if (scope.programId && scope.programId.length > 0) {
        if (!context.programId || !scope.programId.includes(context.programId)) {
          return false;
        }
      }

      // Check issuerId
      if (scope.issuerId && scope.issuerId.length > 0) {
        if (!context.issuerId || !scope.issuerId.includes(context.issuerId)) {
          return false;
        }
      }

      // Check country
      if (scope.country && scope.country.length > 0) {
        if (!scope.country.includes(context.country)) {
          return false;
        }
      }

      // Check role
      if (scope.role && scope.role.length > 0) {
        if (!scope.role.includes(context.userRole)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort rules by priority (higher first)
   */
  private sortRulesByPriority(rules: Rule[]): Rule[] {
    return [...rules].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get field value from data or context using dot notation
   */
  private getFieldValue(
    field: string,
    data: Record<string, any>,
    context: ExecutionContext
  ): any {
    // Support both data.field and context.field
    if (field.startsWith('context.')) {
      const contextField = field.substring(8);
      return this.getNestedValue(context, contextField);
    }
    
    return this.getNestedValue(data, field);
  }

  /**
   * Set field value in data using dot notation
   */
  private setFieldValue(
    field: string,
    value: any,
    data: Record<string, any>
  ): void {
    const parts = field.split('.');
    let current = data;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Get nested value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, part) => current?.[part], obj);
  }

  /**
   * Type guard for simple condition
   */
  private isSimpleCondition(condition: Condition): condition is SimpleCondition {
    return 'field' in condition && 'op' in condition;
  }

  /**
   * Load ruleset from storage
   * Uses Config Service via RuleStorage
   */
  private async loadRuleSet(
    ruleSetId: string,
    context: ExecutionContext
  ): Promise<RuleSet | null> {
    const { RuleStorage } = await import('./storage/rule-storage');
    const storage = new RuleStorage();
    return await storage.getRuleSet(ruleSetId);
  }
}
