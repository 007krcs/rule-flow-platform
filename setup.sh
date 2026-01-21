#!/bin/bash

# Complete Setup Script for Rule Flow Platform
set -e

echo "🚀 Rule Flow Platform - Complete Setup"
echo "========================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not installed. You'll need PostgreSQL and Redis manually."
else
    echo "✓ Docker found"
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🗄️  Setting up databases..."

# Start Docker services
if command -v docker &> /dev/null; then
    echo "Starting PostgreSQL and Redis..."
    docker-compose up -d postgres redis || echo "⚠️  Docker services not started"
    
    echo "Waiting for PostgreSQL..."
    sleep 5
fi

echo ""
echo "🔧 Running database migrations..."
cd packages/backend/config-service
pnpm db:migrate || echo "⚠️  Migration skipped (run manually when DB is ready)"
cd ../../..

echo ""
echo "🌱 Seeding database..."
cd packages/backend/config-service
pnpm db:seed || echo "⚠️  Seed skipped (run manually when DB is ready)"
cd ../../..

echo ""
echo "🏗️  Building backend services..."
pnpm --filter @ruleflow/shared run build
pnpm --filter @ruleflow/rule-engine run build
pnpm --filter @ruleflow/config-service run build
pnpm --filter @ruleflow/gateway-service run build
pnpm --filter @ruleflow/editor-api run build
pnpm --filter @ruleflow/graphql-api run build
pnpm --filter @ruleflow/realtime-service run build
pnpm --filter @ruleflow/ai-service run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start all services:"
echo "   pnpm run dev"
echo ""
echo "2. Or start services individually:"
echo "   cd packages/backend/rule-engine && pnpm dev  # Port 3001"
echo "   cd packages/backend/config-service && pnpm dev  # Port 3002"
echo "   cd packages/backend/gateway-service && pnpm dev  # Port 3003"
echo "   cd packages/backend/graphql-api && pnpm dev  # Port 3005"
echo "   cd packages/backend/realtime-service && pnpm dev  # Port 3006"
echo "   cd packages/backend/ai-service && pnpm dev  # Port 3007"
echo "   cd packages/frontend/runtime-app && pnpm dev  # Port 3011"
echo "   cd packages/frontend/rule-editor-ui && pnpm dev  # Port 3010"
echo "   cd packages/frontend/visual-designer && pnpm dev  # Port 3012"
echo ""
echo "3. Access the applications:"
echo "   Runtime App: http://localhost:3011"
echo "   Rule Editor: http://localhost:3010"
echo "   Visual Designer: http://localhost:3012"
echo "   GraphQL Playground: http://localhost:3005/graphql"
echo "   Demo App: http://localhost:5173"
echo ""
echo "   APIs:"
echo "   Rule Engine: http://localhost:3001/health"
echo "   Config Service: http://localhost:3002/health"
echo "   Gateway: http://localhost:3003/health"
echo "   GraphQL API: http://localhost:3005/health"
echo "   Real-time: http://localhost:3006/health"
echo "   AI Service: http://localhost:3007/health"
echo ""
echo "🎉 Happy coding!"
