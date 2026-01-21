/**
 * Config Service API
 * Manages rulesets and rules (CRUD operations)
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { query } from './database/pool';
import type { RuleSet, Rule } from '@ruleflow/shared';

const app: express.Application = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'config-service' });
});

// Get all rulesets
app.get('/api/rulesets', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM rulesets WHERE enabled = true ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ruleset by ID with all rules
app.get('/api/rulesets/:rulesetId', async (req: Request, res: Response) => {
  try {
    const { rulesetId } = req.params;
    
    const rulesetResult = await query(
      'SELECT * FROM rulesets WHERE ruleset_id = $1',
      [rulesetId]
    );
    
    if (rulesetResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ruleset not found' });
    }
    
    const ruleset = rulesetResult.rows[0];
    
    const rulesResult = await query(
      'SELECT * FROM rules WHERE ruleset_id = $1 AND enabled = true ORDER BY priority DESC',
      [ruleset.id]
    );
    
    const response: RuleSet = {
      ruleSetId: ruleset.ruleset_id,
      name: ruleset.name,
      version: ruleset.version,
      strategy: ruleset.strategy,
      rules: rulesResult.rows.map(r => ({
        ruleId: r.rule_id,
        name: r.name,
        description: r.description,
        version: '1.0',
        enabled: r.enabled,
        scope: r.scope,
        when: r.condition,
        then: r.actions,
        priority: r.priority,
        stopOnMatch: r.stop_on_match,
        tags: r.tags
      })),
      enabled: false
    };
    
    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create ruleset
app.post('/api/rulesets', async (req: Request, res: Response) => {
  try {
    const { ruleSetId, name, version, strategy, metadata } = req.body;
    
    const result = await query(`
      INSERT INTO rulesets (ruleset_id, name, version, strategy, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [ruleSetId, name, version, strategy, JSON.stringify(metadata)]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create rule
app.post('/api/rulesets/:rulesetId/rules', async (req: Request, res: Response) => {
  try {
    const { rulesetId } = req.params;
    const { ruleId, name, description, when, then: actions, scope, priority, tags } = req.body;
    
    // Get ruleset UUID
    const rulesetResult = await query(
      'SELECT id FROM rulesets WHERE ruleset_id = $1',
      [rulesetId]
    );
    
    if (rulesetResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ruleset not found' });
    }
    
    const result = await query(`
      INSERT INTO rules (
        ruleset_id, rule_id, name, description, condition, actions, scope, priority, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      rulesetResult.rows[0].id,
      ruleId,
      name,
      description,
      JSON.stringify(when),
      JSON.stringify(actions),
      JSON.stringify(scope),
      priority,
      tags
    ]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update rule
app.put('/api/rulesets/:rulesetId/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const { rulesetId, ruleId } = req.params;
    const updates = req.body;
    
    const result = await query(`
      UPDATE rules r
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        condition = COALESCE($3, condition),
        actions = COALESCE($4, actions),
        scope = COALESCE($5, scope),
        priority = COALESCE($6, priority),
        enabled = COALESCE($7, enabled),
        updated_at = NOW()
      FROM rulesets rs
      WHERE r.ruleset_id = rs.id 
        AND rs.ruleset_id = $8 
        AND r.rule_id = $9
      RETURNING r.*
    `, [
      updates.name,
      updates.description,
      updates.when ? JSON.stringify(updates.when) : null,
      updates.then ? JSON.stringify(updates.then) : null,
      updates.scope ? JSON.stringify(updates.scope) : null,
      updates.priority,
      updates.enabled,
      rulesetId,
      ruleId
    ]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete rule
app.delete('/api/rulesets/:rulesetId/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const { rulesetId, ruleId } = req.params;
    
    await query(`
      DELETE FROM rules r
      USING rulesets rs
      WHERE r.ruleset_id = rs.id 
        AND rs.ruleset_id = $1 
        AND r.rule_id = $2
    `, [rulesetId, ruleId]);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✓ Config Service listening on port ${port}`);
});

export default app;
