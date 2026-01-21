/**
 * Rule Flow SDK
 * Embeddable JavaScript SDK for integrating Rule Flow Platform
 */

import axios, { AxiosInstance } from 'axios';

export interface RuleFlowConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface ExecutionContext {
  userRole: string;
  country: string;
  programId?: string;
  issuerId?: string;
  [key: string]: any;
}

export interface ExecuteOptions {
  ruleSetId: string;
  context: ExecutionContext;
  data?: Record<string, any>;
}

export class RuleFlowSDK {
  private client: AxiosInstance;
  private config: RuleFlowConfig;

  constructor(config: RuleFlowConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: config.apiKey ? {
        'Authorization': `Bearer ${config.apiKey}`
      } : {}
    });
  }

  /**
   * Execute rules against data
   */
  async executeRules(options: ExecuteOptions): Promise<any> {
    try {
      const response = await this.client.post('/api/execute', {
        ruleSetId: options.ruleSetId,
        context: {
          ...options.context,
          correlationId: this.generateCorrelationId(),
          deviceType: 'API',
          isMobile: false,
          locale: 'en-US',
          permissions: [],
          timestamp: Date.now(),
          data: options.data || {}
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Rule execution failed: ${error.message}`);
    }
  }

  /**
   * Execute peculiarity processing (matches your architecture)
   */
  async executePeculiarities(options: {
    tradeId: string;
    programId: string;
    issuerId: string;
    data?: Record<string, any>;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/peculiarity/execute', options);
      return response.data;
    } catch (error: any) {
      throw new Error(`Peculiarity execution failed: ${error.message}`);
    }
  }

  /**
   * Get available rulesets
   */
  async getRuleSets(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/rulesets');
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch rulesets: ${error.message}`);
    }
  }

  /**
   * Get specific ruleset
   */
  async getRuleSet(ruleSetId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/rulesets/${ruleSetId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch ruleset: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  private generateCorrelationId(): string {
    return `sdk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create SDK instance
 */
export function createRuleFlowSDK(config: RuleFlowConfig): RuleFlowSDK {
  return new RuleFlowSDK(config);
}

// Default export
export default RuleFlowSDK;
