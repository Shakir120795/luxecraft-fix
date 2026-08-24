#!/usr/bin/env bash
# LuxeCraft — Project Command Runner (Linux/macOS)
# Usage: ./dev <command>

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

show_help() {
  echo ""
  echo "LuxeCraft — Development Command Runner"
  echo ""
  echo "Usage: ./dev.sh <command>"
  echo ""
  echo "Setup & Installation"
  echo "  setup          Verify environment and show setup instructions"
  echo "  install        Install all dependencies"
  echo ""
  echo "Development"
  echo "  dev:api        Start NestJS API (port 3001)"
  echo "  dev:storefront Start customer storefront (port 3000)"
  echo "  dev:storefront:clean Clear storefront cache and start it"
  echo "  dev:admin      Start admin panel (port 3002)"
  echo ""
  echo "Build"
  echo "  build          Build all apps"
  echo "  build:api      Build API only"
  echo "  build:storefront Build storefront only"
  echo "  build:admin    Build admin only"
  echo ""
  echo "Quality"
  echo "  lint           Lint all apps"
  echo "  typecheck      Typecheck all apps"
  echo "  test           Run all tests"
  echo ""
  echo "Database"
  echo "  db:migrate     Run Prisma migrations (production)"
  echo "  db:migrate:dev Run Prisma migrations (development)"
  echo "  db:seed        Seed the database"
  echo "  db:studio      Open Prisma Studio"
  echo "  db:generate    Regenerate Prisma client"
  echo ""
  echo "Docker"
  echo "  docker:up      Start Docker services (PostgreSQL + Redis)"
  echo "  docker:down    Stop Docker services"
  echo "  docker:logs    Stream Docker service logs"
  echo "  docker:reset   Stop and remove all Docker volumes"
  echo ""
  echo "Operations"
  echo "  health         Check API health"
  echo "  logs           Stream Docker logs"
  echo ""
}

CMD="${1:-help}"

case "$CMD" in
  help)             show_help ;;
  setup)            node scripts/setup.js ;;
  install)          npm install ;;
  dev:api)          cd apps/api && npm run dev ;;
  dev:storefront)   cd apps/storefront && npm run dev ;;
  dev:storefront:clean) npm run dev:storefront:clean ;;
  dev:admin)        cd apps/admin && npm run dev ;;
  build)            npm run build ;;
  build:api)        npm run build:api ;;
  build:storefront) npm run build:storefront ;;
  build:admin)      npm run build:admin ;;
  lint)             npm run lint ;;
  typecheck)        npm run typecheck ;;
  test)             npm run test ;;
  db:migrate)       cd apps/api && npx prisma migrate deploy ;;
  db:migrate:dev)   cd apps/api && npx prisma migrate dev ;;
  db:seed)          cd apps/api && npx ts-node prisma/seed.ts ;;
  db:studio)        cd apps/api && npx prisma studio ;;
  db:generate)      cd apps/api && npx prisma generate ;;
  docker:up)        docker compose -f docker/docker-compose.yml up -d ;;
  docker:down)      docker compose -f docker/docker-compose.yml down ;;
  docker:logs)      docker compose -f docker/docker-compose.yml logs -f ;;
  docker:reset)     docker compose -f docker/docker-compose.yml down -v ;;
  health)           node scripts/health-check.js ;;
  logs)             docker compose -f docker/docker-compose.yml logs -f ;;
  *)
    echo "Unknown command: $CMD"
    show_help
    exit 1
    ;;
esac
