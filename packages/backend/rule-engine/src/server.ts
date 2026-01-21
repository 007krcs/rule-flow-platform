/**
 * Rule Engine API Server
 * REST API for executing rules
 */

import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import { RuleEngine } from './rule-engine';
import { RuleExecutionRequest, RuleExecutionResult } from './types';
import { Logger } from './logger';

const app: Application = express();
const port = process.env.PORT || 3001;
const logger = new Logger('RuleEngineAPI');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize rule engine
const ruleEngine = new RuleEngine();

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rule-engine-api', timestamp: new Date().toISOString() });
});

// Execute rules
app.post('/api/execute', async (req: Request, res: Response) => {
  try {
    const request: RuleExecutionRequest = req.body;
    
    logger.info('Executing rules', { 
      ruleSetId: request.ruleSetId,
      correlationId: request.context.correlationId 
    });

    const result: RuleExecutionResult = await ruleEngine.execute(request);

    res.json(result);
  } catch (error: any) {
    logger.error('Error executing rules', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
app.listen(port, () => {
  logger.info(`Rule Engine API listening on port ${port}`);
  logger.info(`Health check: http://localhost:${port}/health`);
  logger.info(`Execute endpoint: POST http://localhost:${port}/api/execute`);
});

export default app;
