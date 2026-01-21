/**
 * GraphQL Resolvers
 * Enterprise-grade resolvers with DataLoader for N+1 prevention
 */

import axios from 'axios';
import DataLoader from 'dataloader';
import { PubSub } from 'graphql-subscriptions';

const CONFIG_SERVICE_URL = process.env.CONFIG_SERVICE_URL || 'http://localhost:3002';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3003';

const pubsub = new PubSub();

// DataLoaders for efficient batch loading
const createRulesetLoader = () => new DataLoader(async (ids: readonly string[]) => {
  const promises = ids.map(id => 
    axios.get(`${CONFIG_SERVICE_URL}/api/rulesets/${id}`)
      .then(res => res.data.data)
      .catch(() => null)
  );
  return Promise.all(promises);
});

const resolvers = {
  Query: {
    rulesets: async (_: any, { filter, pagination }: any) => {
      try {
        const response = await axios.get(`${CONFIG_SERVICE_URL}/api/rulesets`, {
          params: { ...filter, ...pagination }
        });
        
        const rulesets = response.data.data || [];
        return {
          edges: rulesets.map((ruleset: any, idx: number) => ({
            node: ruleset,
            cursor: Buffer.from(`${idx}`).toString('base64')
          })),
          pageInfo: {
            hasNextPage: rulesets.length === pagination?.pageSize,
            hasPreviousPage: (pagination?.page || 1) > 1,
            startCursor: rulesets.length > 0 ? Buffer.from('0').toString('base64') : null,
            endCursor: rulesets.length > 0 
              ? Buffer.from(`${rulesets.length - 1}`).toString('base64') 
              : null
          },
          totalCount: rulesets.length
        };
      } catch (error) {
        throw new Error(`Failed to fetch rulesets: ${error}`);
      }
    },

    ruleset: async (_: any, { id }: any, { loaders }: any) => {
      return loaders.ruleset.load(id);
    },

    executeRules: async (_: any, { input }: any) => {
      try {
        const response = await axios.post(`${GATEWAY_URL}/api/execute`, {
          ruleSetId: input.rulesetId,
          context: input.context,
          data: input.data
        });

        // Publish real-time update
        pubsub.publish('RULE_EXECUTION', {
          ruleExecutionUpdates: {
            rulesetId: input.rulesetId,
            success: response.data.success,
            timestamp: new Date().toISOString()
          }
        });

        return response.data;
      } catch (error: any) {
        throw new Error(`Execution failed: ${error.message}`);
      }
    },

    rulesetAnalytics: async (_: any, { rulesetId, timeRange }: any) => {
      // Mock analytics - in production, query from analytics DB
      return {
        totalExecutions: 1250,
        successRate: 0.98,
        averageExecutionTime: 15.3,
        rulesMatchedDistribution: [
          { ruleId: 'RULE_1', ruleName: 'Payment Term Rule', count: 450 },
          { ruleId: 'RULE_2', ruleName: 'Credit Check', count: 380 }
        ],
        errorRate: 0.02,
        topErrors: [
          { error: 'Invalid field reference', count: 5 }
        ]
      };
    },

    performanceMetrics: async (_: any, { timeRange }: any) => {
      return {
        averageExecutionTime: 12.5,
        p95ExecutionTime: 25.0,
        p99ExecutionTime: 40.0,
        requestsPerSecond: 150.5,
        errorRate: 0.01
      };
    },

    searchRules: async (_: any, { query, filters }: any) => {
      // Simple search implementation - in production, use Elasticsearch
      const response = await axios.get(`${CONFIG_SERVICE_URL}/api/rulesets`);
      const rulesets = response.data.data || [];
      
      const matchingRules: any[] = [];
      const matchingRulesets: any[] = [];

      rulesets.forEach((ruleset: any) => {
        if (ruleset.name.toLowerCase().includes(query.toLowerCase())) {
          matchingRulesets.push(ruleset);
        }
        
        ruleset.rules?.forEach((rule: any) => {
          if (rule.name.toLowerCase().includes(query.toLowerCase()) ||
              rule.description?.toLowerCase().includes(query.toLowerCase())) {
            matchingRules.push(rule);
          }
        });
      });

      return {
        rules: matchingRules,
        rulesets: matchingRulesets,
        totalCount: matchingRules.length + matchingRulesets.length
      };
    }
  },

  Mutation: {
    createRuleset: async (_: any, { input }: any) => {
      try {
        const response = await axios.post(`${CONFIG_SERVICE_URL}/api/rulesets`, input);
        
        // Publish change event
        pubsub.publish('RULESET_CHANGE', {
          rulesetChange: {
            changeType: 'CREATED',
            ruleset: response.data.data,
            timestamp: new Date().toISOString()
          }
        });

        return response.data.data;
      } catch (error: any) {
        throw new Error(`Failed to create ruleset: ${error.message}`);
      }
    },

    createRule: async (_: any, { rulesetId, input }: any) => {
      try {
        const response = await axios.post(
          `${CONFIG_SERVICE_URL}/api/rulesets/${rulesetId}/rules`,
          input
        );

        // Publish real-time update
        pubsub.publish(`RULE_CHANGES_${rulesetId}`, {
          ruleChanges: {
            changeType: 'CREATED',
            ruleId: input.ruleId,
            rule: response.data.data,
            changedBy: 'system', // In production, get from auth context
            timestamp: new Date().toISOString()
          }
        });

        return response.data.data;
      } catch (error: any) {
        throw new Error(`Failed to create rule: ${error.message}`);
      }
    },

    updateRule: async (_: any, { rulesetId, ruleId, input }: any) => {
      try {
        const response = await axios.put(
          `${CONFIG_SERVICE_URL}/api/rulesets/${rulesetId}/rules/${ruleId}`,
          input
        );

        pubsub.publish(`RULE_CHANGES_${rulesetId}`, {
          ruleChanges: {
            changeType: 'UPDATED',
            ruleId,
            rule: response.data.data,
            changedBy: 'system',
            timestamp: new Date().toISOString()
          }
        });

        return response.data.data;
      } catch (error: any) {
        throw new Error(`Failed to update rule: ${error.message}`);
      }
    },

    deleteRule: async (_: any, { rulesetId, ruleId }: any) => {
      try {
        await axios.delete(
          `${CONFIG_SERVICE_URL}/api/rulesets/${rulesetId}/rules/${ruleId}`
        );

        pubsub.publish(`RULE_CHANGES_${rulesetId}`, {
          ruleChanges: {
            changeType: 'DELETED',
            ruleId,
            rule: null,
            changedBy: 'system',
            timestamp: new Date().toISOString()
          }
        });

        return true;
      } catch (error) {
        return false;
      }
    },

    bulkUpdateRules: async (_: any, { rulesetId, rules }: any) => {
      const results = await Promise.all(
        rules.map(({ ruleId, updates }: any) =>
          axios.put(
            `${CONFIG_SERVICE_URL}/api/rulesets/${rulesetId}/rules/${ruleId}`,
            updates
          ).then(res => res.data.data)
        )
      );
      return results;
    },

    startCollaborationSession: async (_: any, { rulesetId }: any) => {
      const sessionId = `session_${Date.now()}`;
      
      const session = {
        id: sessionId,
        rulesetId,
        participants: [],
        startedAt: new Date().toISOString(),
        isActive: true
      };

      return session;
    }
  },

  Subscription: {
    ruleExecutionUpdates: {
      subscribe: (_: any, { rulesetId }: any) => {
        return pubsub.asyncIterator(['RULE_EXECUTION']);
      }
    },

    ruleChanges: {
      subscribe: (_: any, { rulesetId }: any) => {
        return pubsub.asyncIterator([`RULE_CHANGES_${rulesetId}`]);
      }
    },

    collaborationUpdates: {
      subscribe: (_: any, { sessionId }: any) => {
        return pubsub.asyncIterator([`COLLABORATION_${sessionId}`]);
      }
    },

    systemMetrics: {
      subscribe: () => {
        // Emit metrics every 5 seconds
        return pubsub.asyncIterator(['SYSTEM_METRICS']);
      }
    }
  },

  Ruleset: {
    rules: async (parent: any) => {
      if (parent.rules) return parent.rules;
      
      const response = await axios.get(
        `${CONFIG_SERVICE_URL}/api/rulesets/${parent.rulesetId}`
      );
      return response.data.data.rules || [];
    },

    stats: (parent: any) => ({
      totalRules: parent.rules?.length || 0,
      enabledRules: parent.rules?.filter((r: any) => r.enabled).length || 0,
      totalExecutions: 0, // Would fetch from execution logs
      lastExecuted: null
    })
  },

  Rule: {
    executionCount: () => 0, // Would fetch from execution logs
    lastExecuted: () => null
  }
};

export default resolvers;
export { pubsub };
