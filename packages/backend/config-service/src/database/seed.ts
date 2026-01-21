/**
 * Database Seed
 * Populates with example rulesets and rules
 */

import pool from './pool';

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert example ruleset
    const rulesetResult = await client.query(`
      INSERT INTO rulesets (ruleset_id, name, version, strategy, enabled, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (ruleset_id) DO NOTHING
      RETURNING id
    `, [
      'PECULIARITY_RULES_DE_FR',
      'Peculiarity Rules - DE/FR Programs',
      '1.0.0',
      'all',
      true,
      JSON.stringify({ description: 'Rules for German and French programs' })
    ]);

    // const rulesetId = rulesetResult.rows[0].id;

    // Insert example rules
    const rules = [
      {
        rule_id: 'PAYMENT_TERM_EUR_HIGH_AMOUNT',
        name: 'Payment Term for High EUR Amounts',
        description: 'Set payment term to 30 days for EUR transactions over 10,000',
        condition: {
          all: [
            { field: 'currency', op: 'eq', value: 'EUR' },
            { field: 'amount', op: 'gt', value: 10000 }
          ]
        },
        actions: [
          { type: 'set', field: 'paymentTerm', value: 30 },
          { type: 'set', field: 'peculiarity.paymentTermReason', value: 'High amount EUR transaction' }
        ],
        scope: {
          country: ['DE', 'FR'],
          programId: ['123'],
          role: ['ADMIN', 'OPS', 'TRADER']
        },
        priority: 10,
        tags: ['payment', 'peculiarity', 'EUR']
      },
      {
        rule_id: 'CREDIT_CHECK_HIGH_RISK',
        name: 'Credit Check for High Risk',
        description: 'Require manual approval for high risk customers',
        condition: {
          any: [
            { field: 'riskScore', op: 'gt', value: 80 },
            {
              all: [
                { field: 'amount', op: 'gt', value: 50000 },
                { field: 'customerType', op: 'eq', value: 'NEW' }
              ]
            }
          ]
        },
        actions: [
          { type: 'set', field: 'requiresApproval', value: true },
          { type: 'set', field: 'approvalLevel', value: 'SENIOR_RISK_MANAGER' },
          { type: 'append', field: 'flags', value: 'HIGH_RISK' }
        ],
        scope: {
          country: ['DE', 'FR'],
          role: ['ADMIN', 'RISK_MANAGER']
        },
        priority: 30,
        tags: ['risk', 'approval']
      },
      {
        rule_id: 'COMPLIANCE_CHECK_LARGE_TRADE',
        name: 'Compliance Check for Large Trades',
        description: 'Flag large trades for compliance review',
        condition: {
          field: 'amount',
          op: 'gte',
          value: 100000
        },
        actions: [
          { type: 'set', field: 'complianceReviewRequired', value: true },
          { type: 'append', field: 'flags', value: 'COMPLIANCE_REVIEW' }
        ],
        priority: 25,
        tags: ['compliance']
      }
    ];

    for (const rule of rules) {
      await client.query(`
        INSERT INTO rulesets (ruleset_id, name, version, strategy, enabled, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (ruleset_id) DO NOTHING
    `, [
      'PECULIARITY_RULES_123_ISSUER_001',
      'Peculiarity Rules - Program 123',
      '1.0.0',
      'all',
      true,
      JSON.stringify({ description: 'Rules for program 123' })
    ]);
    }

    await client.query('COMMIT');
    console.log('✓ Database seeded successfully');
    console.log(`  - 1 ruleset created`);
    console.log(`  - ${rules.length} rules created`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Seed failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seed;
