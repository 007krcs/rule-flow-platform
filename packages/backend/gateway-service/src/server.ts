/**
 * Gateway Service (Peculiarity Execution Gateway)
 * Orchestrates rule execution - matches architecture diagram
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';

const app: express.Express = express();
const port = process.env.PORT || 3003;

const RULE_ENGINE_URL = process.env.RULE_ENGINE_URL || 'http://localhost:3001';
const CONFIG_SERVICE_URL = process.env.CONFIG_SERVICE_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'gateway-service' });
});

/**
 * Execute Peculiarity Processing
 * Matches architecture: receives request from ATIS/One A&T, 
 * orchestrates rule execution, returns results
 */
app.post('/api/peculiarity/execute', async (req: Request, res: Response) => {
  try {
    const { tradeId, programId, issuerId, data, ruleSubset } = req.body;
    
    console.log(`Processing peculiarities for trade ${tradeId}`);
    
    // Step 1: Fetch trade data (in real system, would query One A&T DB)
    // For now, use data from request
    const tradeData = data || {
      tradeId,
      programId,
      issuerId,
      // Would fetch from database...
    };
    
    // Step 2: Determine which ruleset to use
    const ruleSetId ='PECULIARITY_RULES_DE_FR';
    
    // Step 3: Build execution context
    const executionContext = {
      userRole: req.headers['x-user-role'] as string || 'SYSTEM',
      country: tradeData.country || 'DE',
      programId,
      issuerId,
      correlationId: tradeData.tradeId || `corr-${Date.now()}`,
      deviceType: 'API' as const,
      isMobile: false,
      locale: 'en-US',
      permissions: ['TRADE_PROCESS'],
      data: tradeData,
      timestamp: Date.now()
    };
    
    // Step 4: Call Rules Engine API
    console.log(`Calling Rules Engine with ruleset: ${ruleSetId}`);
    
    const ruleEngineResponse = await axios.post(`${RULE_ENGINE_URL}/api/execute`, {
      ruleSetId,
      context: executionContext
    });
    
    const ruleResult = ruleEngineResponse.data;
    
    // Step 5: Extract peculiarities from result
    const peculiarities = {
      paymentTerm: ruleResult.data.paymentTerm,
      requiresApproval: ruleResult.data.requiresApproval,
      approvalLevel: ruleResult.data.approvalLevel,
      complianceReviewRequired: ruleResult.data.complianceReviewRequired,
      flags: ruleResult.data.flags || [],
      peculiarity: ruleResult.data.peculiarity || {}
    };
    
    // Step 6: Update peculiarity repository (would write to database)
    // await savePeculiarities(tradeId, peculiarities);
    
    // Step 7: Return response to caller
    res.json({
      success: true,
      tradeId,
      peculiarities,
      updatedData: ruleResult.data,
      metadata: {
        rulesMatched: ruleResult.metadata.rulesMatched,
        executionTimeMs: ruleResult.metadata.executionTimeMs
      }
    });
    
  } catch (error: any) {
    console.error('Gateway error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * Generic rule execution endpoint
 * For any rule execution needs
 */
app.post('/api/execute', async (req: Request, res: Response) => {
  try {
    const ruleEngineResponse = await axios.post(`${RULE_ENGINE_URL}/api/execute`, req.body);
    res.json(ruleEngineResponse.data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get available rulesets
 */
app.get('/api/rulesets', async (req: Request, res: Response) => {
  try {
    const configResponse = await axios.get(`${CONFIG_SERVICE_URL}/api/rulesets`);
    res.json(configResponse.data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`✓ Gateway Service (Peculiarity Execution Gateway) listening on port ${port}`);
  console.log(`  Rule Engine: ${RULE_ENGINE_URL}`);
  console.log(`  Config Service: ${CONFIG_SERVICE_URL}`);
});

export default app;
