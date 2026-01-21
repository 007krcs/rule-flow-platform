/**
 * Expression Evaluator
 * MVEL-compatible expression evaluation using expr-eval and jexl
 * Provides safe, sandboxed expression execution
 */

import { Parser } from 'expr-eval';
import jexl from 'jexl';

export class ExpressionEvaluatorImpl {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.setupJexl();
  }

  /**
   * Evaluate an expression safely
   * Supports both simple expressions and MVEL-style syntax
   */
  evaluate(expression: string, context: Record<string, any>): any {
    try {
      // Try expr-eval first (faster for simple math)
      if (this.isSimpleMathExpression(expression)) {
        return this.parser.evaluate(expression, context);
      }

      // Use jexl for complex expressions
      return jexl.evalSync(expression, context);
    } catch (error: any) {
      throw new Error(`Expression evaluation failed: ${error.message}`);
    }
  }

  /**
   * Validate expression syntax
   */
  isValid(expression: string): boolean {
    try {
      this.parser.parse(expression);
      return true;
    } catch {
      try {
        jexl.compile(expression);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Setup jexl with custom transforms and functions
   */
  private setupJexl(): void {
    // Add custom transforms
    jexl.addTransform('upper', (val: string) => val.toUpperCase());
    jexl.addTransform('lower', (val: string) => val.toLowerCase());
    jexl.addTransform('length', (val: any[] | string) => val.length);
    
    // Add date functions
    jexl.addFunction('now', () => Date.now());
    jexl.addFunction('date', (str: string) => new Date(str).getTime());
    
    // Add utility functions
    jexl.addFunction('min', (...args: number[]) => Math.min(...args));
    jexl.addFunction('max', (...args: number[]) => Math.max(...args));
    jexl.addFunction('round', (num: number, decimals = 0) => {
      return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
    });
  }

  /**
   * Check if expression is simple math (optimization)
   */
  private isSimpleMathExpression(expression: string): boolean {
    return /^[\d\s+\-*/(). ]+$/.test(expression);
  }
}
