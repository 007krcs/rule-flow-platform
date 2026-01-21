/**
 * Rule Storage - Loads rules from Config Service
 */

import axios from 'axios';
import type { RuleSet } from '../types';

const CONFIG_SERVICE_URL = process.env.CONFIG_SERVICE_URL || 'http://localhost:3002';

export class RuleStorage {
  private cache: Map<string, { data: RuleSet; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async getRuleSet(ruleSetId: string): Promise<RuleSet | null> {
    // Check cache
    const cached = this.cache.get(ruleSetId);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`Cache hit for ruleset: ${ruleSetId}`);
      return cached.data;
    }

    try {
      console.log(`Loading ruleset from Config Service: ${ruleSetId}`);
      const response = await axios.get(`${CONFIG_SERVICE_URL}/api/rulesets/${ruleSetId}`);
      
      if (response.data.success && response.data.data) {
        const ruleSet = response.data.data;
        
        // Cache it
        this.cache.set(ruleSetId, {
          data: ruleSet,
          timestamp: Date.now()
        });
        
        console.log(`Loaded ${ruleSet.rules.length} rules for ruleset: ${ruleSetId}`);
        return ruleSet;
      }
      
      return null;
    } catch (error: any) {
      console.error(`Failed to load ruleset ${ruleSetId}:`, error.message);
      return null;
    }
  }

  clearCache(ruleSetId?: string) {
    if (ruleSetId) {
      this.cache.delete(ruleSetId);
    } else {
      this.cache.clear();
    }
  }
}
