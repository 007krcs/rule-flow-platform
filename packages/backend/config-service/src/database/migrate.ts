/**
 * Database Migrations
 * Creates all required tables
 */

import pool from './pool';

async function migrate() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create rulesets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rulesets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ruleset_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(50) NOT NULL,
        strategy VARCHAR(50) NOT NULL DEFAULT 'all',
        enabled BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create rules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ruleset_id UUID REFERENCES rulesets(id) ON DELETE CASCADE,
        rule_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        condition JSONB NOT NULL,
        actions JSONB NOT NULL,
        scope JSONB,
        priority INTEGER NOT NULL DEFAULT 0,
        enabled BOOLEAN DEFAULT true,
        stop_on_match BOOLEAN DEFAULT false,
        tags TEXT[],
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_by VARCHAR(255),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(ruleset_id, rule_id)
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rules_ruleset ON rules(ruleset_id);
      CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled);
      CREATE INDEX IF NOT EXISTS idx_rules_priority ON rules(priority DESC);
      CREATE INDEX IF NOT EXISTS idx_rules_scope ON rules USING GIN(scope);
      CREATE INDEX IF NOT EXISTS idx_rulesets_enabled ON rulesets(enabled);
    `);

    // Create execution_logs table for audit
    await client.query(`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ruleset_id VARCHAR(255) NOT NULL,
        correlation_id VARCHAR(255),
        context JSONB,
        rules_matched TEXT[],
        execution_time_ms INTEGER,
        success BOOLEAN,
        error TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_execution_logs_ruleset ON execution_logs(ruleset_id);
      CREATE INDEX IF NOT EXISTS idx_execution_logs_correlation ON execution_logs(correlation_id);
      CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON execution_logs(created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('✓ Database migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migrate;
