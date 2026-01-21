# Rule Flow Platform - Complete Documentation

## 📚 Documentation Index

### Getting Started
- [Quick Start Guide](../QUICK_START.md)
- [Installation](../DEPLOYMENT_GUIDE.md)
- [Architecture Overview](../docs/ARCHITECTURE.md)

### Developer Guides
- [API Documentation](#api-documentation)
- [SDK Usage](#sdk-usage)
- [Creating Custom Rules](#creating-rules)
- [UI Adapter System](../docs/LIBRARY_INTEGRATION_EXAMPLES.md)

### Deployment
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployment](#cloud-deployment)

---

## API Documentation

### Rule Engine API (Port 3001)

#### POST /api/execute
Execute rules against data

**Request:**
```json
{
  "ruleSetId": "PECULIARITY_RULES_DE_FR",
  "context": {
    "userRole": "ADMIN",
    "country": "DE",
    "programId": "123",
    "issuerId": "ISSUER_001"
  },
  "data": {
    "currency": "EUR",
    "amount": 15000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currency": "EUR",
    "amount": 15000,
    "paymentTerm": 30
  },
  "metadata": {
    "rulesMatched": ["PAYMENT_TERM_EUR_HIGH_AMOUNT"],
    "executionTimeMs": 12
  }
}
```

### Config Service API (Port 3002)

#### GET /api/rulesets
Get all rulesets

#### GET /api/rulesets/:id
Get specific ruleset with rules

#### POST /api/rulesets
Create new ruleset

#### POST /api/rulesets/:rulesetId/rules
Create new rule

#### PUT /api/rulesets/:rulesetId/rules/:ruleId
Update rule

#### DELETE /api/rulesets/:rulesetId/rules/:ruleId
Delete rule

### Gateway Service API (Port 3003)

#### POST /api/peculiarity/execute
Execute peculiarity processing (matches architecture)

**Request:**
```json
{
  "tradeId": "T-123",
  "programId": "123",
  "issuerId": "ISSUER_001",
  "data": {
    "currency": "EUR",
    "amount": 15000
  }
}
```

---

## SDK Usage

### Installation
```bash
npm install @ruleflow/sdk
```

### Basic Usage
```typescript
import { createRuleFlowSDK } from '@ruleflow/sdk';

const sdk = createRuleFlowSDK({
  apiUrl: 'http://localhost:3003',
  apiKey: 'your-api-key' // Optional
});

// Execute rules
const result = await sdk.executeRules({
  ruleSetId: 'PECULIARITY_RULES_DE_FR',
  context: {
    userRole: 'ADMIN',
    country: 'DE',
    programId: '123'
  },
  data: {
    currency: 'EUR',
    amount: 15000
  }
});

console.log(result.data);
```

### Execute Peculiarities
```typescript
const result = await sdk.executePeculiarities({
  tradeId: 'T-123',
  programId: '123',
  issuerId: 'ISSUER_001',
  data: { /* trade data */ }
});
```

---

## Creating Rules

### Rule Structure
```json
{
  "ruleId": "PAYMENT_TERM_RULE",
  "name": "Payment Term for High EUR Amounts",
  "description": "Set 30-day payment term for large EUR transactions",
  "when": {
    "all": [
      { "field": "currency", "op": "eq", "value": "EUR" },
      { "field": "amount", "op": "gt", "value": 10000 }
    ]
  },
  "then": [
    { "type": "set", "field": "paymentTerm", "value": 30 }
  ],
  "scope": {
    "country": ["DE", "FR"],
    "programId": ["123"],
    "role": ["ADMIN", "OPS"]
  },
  "priority": 10
}
```

### Supported Operators
- `eq` - Equals
- `ne` - Not equals
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `in` - In array
- `nin` - Not in array
- `contains` - String contains
- `startsWith` - String starts with
- `endsWith` - String ends with
- `matches` - Regex match

### Supported Actions
- `set` - Set field value
- `calculate` - Calculate using expression
- `append` - Append to array
- `remove` - Remove field

---

## Docker Deployment

### Build Images
```bash
# Build all services
docker-compose build

# Or build individually
docker build -f infrastructure/docker/Dockerfile.rule-engine -t ruleflow/rule-engine .
docker build -f infrastructure/docker/Dockerfile.config-service -t ruleflow/config-service .
docker build -f infrastructure/docker/Dockerfile.gateway -t ruleflow/gateway-service .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

---

## Kubernetes Deployment

### Deploy to Kubernetes
```bash
# Create namespace and deploy
kubectl apply -f infrastructure/kubernetes/deployment.yaml

# Check status
kubectl get pods -n ruleflow

# View logs
kubectl logs -f deployment/rule-engine -n ruleflow
```

### Scale Services
```bash
# Scale rule engine
kubectl scale deployment/rule-engine --replicas=5 -n ruleflow

# Auto-scaling
kubectl autoscale deployment/rule-engine --min=3 --max=10 --cpu-percent=80 -n ruleflow
```

---

## Cloud Deployment

### AWS ECS/EKS
```bash
# Push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag ruleflow/rule-engine:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ruleflow/rule-engine:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ruleflow/rule-engine:latest
```

### Azure Container Apps
```bash
# Deploy to Azure
az containerapp up \
  --name rule-engine \
  --resource-group ruleflow-rg \
  --image ruleflow/rule-engine:latest \
  --target-port 3001 \
  --ingress external
```

### Google Cloud Run
```bash
# Deploy to Cloud Run
gcloud run deploy rule-engine \
  --image gcr.io/project-id/rule-engine:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Testing

### Run Tests
```bash
# Run all tests
pnpm test

# Run specific package tests
cd packages/backend/rule-engine
pnpm test

# Run with coverage
pnpm test --coverage
```

### Integration Tests
```bash
# Start all services
pnpm run dev

# Run integration tests
pnpm test:integration
```

---

## Monitoring

### Health Checks
```bash
curl http://localhost:3001/health  # Rule Engine
curl http://localhost:3002/health  # Config Service
curl http://localhost:3003/health  # Gateway
curl http://localhost:3004/health  # Editor API
```

### Prometheus Metrics
Metrics are exposed at `/metrics` on each service:
- `rule_execution_duration_seconds`
- `rule_evaluation_total`
- `rule_match_rate`

---

## Support

For issues or questions:
- GitHub Issues: [Create Issue](https://github.com/your-org/rule-flow-platform/issues)
- Documentation: [Full Docs](./README.md)
- API Reference: [API Docs](#api-documentation)
