#!/bin/bash

# LuxeCraft Production Deployment Script
# This script deploys the LuxeCraft platform to production

set -e  # Exit on error

echo "🚀 LuxeCraft Production Deployment"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Step 1/8: Installing dependencies..."
npm ci --production=false
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo "🔨 Step 2/8: Building API server..."
cd apps/api
npm run build
cd ../..
echo -e "${GREEN}✓ API built successfully${NC}"
echo ""

echo "🔨 Step 3/8: Building Storefront..."
cd apps/storefront
npm run build
cd ../..
echo -e "${GREEN}✓ Storefront built successfully${NC}"
echo ""

echo "🔨 Step 4/8: Building Admin panel..."
cd apps/admin
npm run build
cd ../..
echo -e "${GREEN}✓ Admin built successfully${NC}"
echo ""

echo "🗄️  Step 5/8: Running database migrations..."
cd apps/api
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations applied${NC}"
echo ""

echo "🌱 Step 6/8: Seeding database (Super Admin creation)..."
npm run db:seed
echo -e "${GREEN}✓ Database seeded${NC}"
echo ""

echo "🐳 Step 7/8: Starting Docker services..."
cd ../..
docker-compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✓ Services started${NC}"
echo ""

echo "🏥 Step 8/8: Running health checks..."
sleep 10  # Wait for services to start

# Check API health
if curl -f http://localhost:3001/api/v1/health/ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API server is healthy${NC}"
else
    echo -e "${RED}❌ API server health check failed${NC}"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs api"
    exit 1
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================="
echo ""
echo "📍 Your services are running at:"
echo "   API Server:  http://localhost:3001"
echo "   Storefront:  http://localhost:3000 (if self-hosted)"
echo "   Admin Panel: http://localhost:3002 (if self-hosted)"
echo ""
echo "📊 Check status:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "📋 View logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f api"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
echo "⚙️  Next steps:"
echo "   1. Configure your domain DNS to point to this server"
echo "   2. Set up Nginx reverse proxy with SSL"
echo "   3. Deploy Storefront & Admin to Vercel (or self-host)"
echo "   4. Configure payment gateway"
echo "   5. Configure email provider"
echo "   6. Test the complete workflow"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
