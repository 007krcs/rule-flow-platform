/**
 * Editor API
 * Business user interface for creating and managing rules
 * Proxies to Config Service for actual storage
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';

const app: express.Express = express();
const port = process.env.PORT || 3004;
const CONFIG_SERVICE_URL = process.env.CONFIG_SERVICE_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'editor-api' });
});

// Proxy all ruleset operations to config service
app.get('/api/rulesets', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${CONFIG_SERVICE_URL}/api/rulesets`);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/rulesets/:id', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${CONFIG_SERVICE_URL}/api/rulesets/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/rulesets', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${CONFIG_SERVICE_URL}/api/rulesets`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/rulesets/:rulesetId/rules', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      `${CONFIG_SERVICE_URL}/api/rulesets/${req.params.rulesetId}/rules`,
      req.body
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/rulesets/:rulesetId/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const response = await axios.put(
      `${CONFIG_SERVICE_URL}/api/rulesets/${req.params.rulesetId}/rules/${req.params.ruleId}`,
      req.body
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/rulesets/:rulesetId/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const response = await axios.delete(
      `${CONFIG_SERVICE_URL}/api/rulesets/${req.params.rulesetId}/rules/${req.params.ruleId}`
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate rule expression
app.post('/api/validate/expression', (req: Request, res: Response) => {
  const { expression } = req.body;
  
  try {
    // Basic validation - in production, use actual MVEL parser
    if (!expression || typeof expression !== 'string') {
      return res.json({ valid: false, error: 'Invalid expression' });
    }
    
    res.json({ valid: true });
  } catch (error: any) {
    res.json({ valid: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✓ Editor API listening on port ${port}`);
  console.log(`  Config Service: ${CONFIG_SERVICE_URL}`);
});

export default app;
