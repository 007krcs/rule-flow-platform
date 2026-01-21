/**
 * AI-Assisted Rule Creation Service
 * Uses Claude/GPT to generate rules from natural language
 */

import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const app: Application = express();
const port = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-test-key'
});

// Rule schema for validation
const RuleSchema = z.object({
  ruleId: z.string(),
  name: z.string(),
  description: z.string(),
  when: z.object({}).passthrough(),
  then: z.array(z.object({}).passthrough()),
  priority: z.number(),
  tags: z.array(z.string()).optional()
});

/**
 * Generate rule from natural language description
 */
app.post('/api/generate-rule', async (req: Request, res: Response) => {
  try {
    const { description, context } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const prompt = `You are an expert at creating business rules for a rule engine. 
Given a natural language description, generate a structured rule in JSON format.

Context: ${context || 'General business rules'}

Description: ${description}

Generate a rule with the following structure:
{
  "ruleId": "UNIQUE_RULE_ID",
  "name": "Human-readable name",
  "description": "Clear description of what the rule does",
  "when": {
    "all": [  // or "any" or simple condition
      { "field": "fieldName", "op": "eq|ne|gt|lt|gte|lte|in|contains", "value": "value" }
    ]
  },
  "then": [
    { "type": "set|calculate|append|remove", "field": "fieldName", "value": "value" }
  ],
  "priority": 10,
  "tags": ["tag1", "tag2"]
}

Supported operators: eq, ne, gt, lt, gte, lte, in, nin, contains, startsWith, endsWith
Supported actions: set, calculate, append, remove

Return ONLY the JSON rule, no explanation.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    const ruleText = content.type === 'text' ? content.text : '';
    
    // Extract JSON from response
    const jsonMatch = ruleText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const rule = JSON.parse(jsonMatch[0]);
    
    // Validate rule structure
    const validatedRule = RuleSchema.parse(rule);

    res.json({
      success: true,
      rule: validatedRule,
      explanation: `Generated rule: ${rule.name}`
    });

  } catch (error: any) {
    console.error('Rule generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Suggest improvements to existing rule
 */
app.post('/api/improve-rule', async (req: Request, res: Response) => {
  try {
    const { rule, feedback } = req.body;

    const prompt = `You are an expert at optimizing business rules.

Current rule:
${JSON.stringify(rule, null, 2)}

User feedback: ${feedback || 'Make it more efficient and clear'}

Suggest improvements to this rule. Consider:
1. Condition optimization
2. Better field names
3. More efficient logic
4. Clearer naming

Return the improved rule in JSON format, followed by a brief explanation of changes.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    const responseText = content.type === 'text' ? content.text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const improvedRule = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      improvedRule,
      explanation: responseText.replace(jsonMatch[0], '').trim()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Explain rule in natural language
 */
app.post('/api/explain-rule', async (req: Request, res: Response) => {
  try {
    const { rule } = req.body;

    const prompt = `Explain this business rule in simple, non-technical language:

${JSON.stringify(rule, null, 2)}

Provide:
1. What the rule does (1-2 sentences)
2. When it applies (conditions)
3. What happens (actions)
4. Business impact

Be concise and clear.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    const explanation = content.type === 'text' ? content.text : '';

    res.json({
      success: true,
      explanation
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate test cases for rule
 */
app.post('/api/generate-test-cases', async (req: Request, res: Response) => {
  try {
    const { rule } = req.body;

    const prompt = `Generate comprehensive test cases for this business rule:

${JSON.stringify(rule, null, 2)}

Generate test cases that cover:
1. Positive cases (rule should match)
2. Negative cases (rule should not match)
3. Edge cases
4. Boundary conditions

Return an array of test cases in JSON format:
[
  {
    "name": "Test case name",
    "input": { "field": "value" },
    "expectedOutput": { "field": "value" },
    "shouldMatch": true,
    "description": "What this tests"
  }
]`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    const responseText = content.type === 'text' ? content.text : '';
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }

    const testCases = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      testCases
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate rule logic
 */
app.post('/api/validate-rule', async (req: Request, res: Response) => {
  try {
    const { rule } = req.body;

    const prompt = `Analyze this business rule for potential issues:

${JSON.stringify(rule, null, 2)}

Check for:
1. Logical errors
2. Performance issues
3. Ambiguous conditions
4. Missing edge cases
5. Best practice violations

Return JSON:
{
  "isValid": true/false,
  "issues": [
    { "severity": "error|warning|info", "message": "Issue description", "suggestion": "How to fix" }
  ],
  "score": 0-100
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    const responseText = content.type === 'text' ? content.text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const validation = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      validation
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate ruleset from business requirements
 */
app.post('/api/generate-ruleset', async (req: Request, res: Response) => {
  try {
    const { requirements, domain } = req.body;

    const prompt = `Generate a complete ruleset from these business requirements:

Domain: ${domain || 'General'}
Requirements:
${requirements}

Create 3-5 rules that together implement these requirements. Return JSON:
{
  "rulesetId": "UNIQUE_ID",
  "name": "Ruleset name",
  "description": "What this ruleset does",
  "rules": [
    // Array of complete rules
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    const responseText = content.type === 'text' ? content.text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const ruleset = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      ruleset
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'ai-service',
    aiProvider: 'Anthropic Claude'
  });
});

app.listen(port, () => {
  console.log(`✓ AI Service listening on port ${port}`);
  console.log(`  Endpoints:`);
  console.log(`    POST /api/generate-rule - Generate rule from description`);
  console.log(`    POST /api/improve-rule - Suggest improvements`);
  console.log(`    POST /api/explain-rule - Explain rule in plain language`);
  console.log(`    POST /api/generate-test-cases - Generate test cases`);
  console.log(`    POST /api/validate-rule - Validate rule logic`);
  console.log(`    POST /api/generate-ruleset - Generate complete ruleset`);
});

export default app;
