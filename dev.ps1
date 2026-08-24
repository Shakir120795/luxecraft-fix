<#
.SYNOPSIS
    LuxeCraft — Project Command Runner (Windows PowerShell)
.DESCRIPTION
    Cross-platform project command system for LuxeCraft development.
.EXAMPLE
    .\dev.ps1 setup
    .\dev.ps1 docker:up
    .\dev.ps1 dev:api
    .\dev.ps1 health
#>

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$Root = $PSScriptRoot
Set-Location $Root

function Show-Help {
    Write-Host ""
    Write-Host "LuxeCraft — Development Command Runner" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 <command>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Setup & Installation"
    Write-Host "  setup          Verify environment and show setup instructions"
    Write-Host "  install        Install all dependencies"
    Write-Host ""
    Write-Host "Development"
    Write-Host "  dev:api        Start NestJS API (port 3001)"
    Write-Host "  dev:storefront Start customer storefront (port 3000)"
    Write-Host "  dev:storefront:clean Clear storefront cache and start it"
    Write-Host "  dev:admin      Start admin panel (port 3002)"
    Write-Host ""
    Write-Host "Build"
    Write-Host "  build          Build all apps"
    Write-Host "  build:api      Build API only"
    Write-Host "  build:storefront Build storefront only"
    Write-Host "  build:admin    Build admin only"
    Write-Host ""
    Write-Host "Quality"
    Write-Host "  lint           Lint all apps"
    Write-Host "  typecheck      Typecheck all apps"
    Write-Host "  test           Run all tests"
    Write-Host ""
    Write-Host "Database"
    Write-Host "  db:migrate     Run Prisma migrations (production)"
    Write-Host "  db:migrate:dev Run Prisma migrations (development)"
    Write-Host "  db:seed        Seed the database"
    Write-Host "  db:studio      Open Prisma Studio"
    Write-Host "  db:generate    Regenerate Prisma client"
    Write-Host ""
    Write-Host "Docker"
    Write-Host "  docker:up      Start Docker services (PostgreSQL + Redis)"
    Write-Host "  docker:down    Stop Docker services"
    Write-Host "  docker:logs    Stream Docker service logs"
    Write-Host "  docker:reset   Stop and remove all Docker volumes"
    Write-Host ""
    Write-Host "Operations"
    Write-Host "  health         Check API health"
    Write-Host "  logs           Stream Docker logs"
    Write-Host ""
}

switch ($Command) {
    "help"             { Show-Help }
    "setup"            { node scripts/setup.js }
    "install"          { npm install }
    "dev:api"          { Set-Location apps/api; npm run dev }
    "dev:storefront"   { Set-Location apps/storefront; npm run dev }
    "dev:storefront:clean" { npm run dev:storefront:clean }
    "dev:admin"        { Set-Location apps/admin; npm run dev }
    "build"            { npm run build }
    "build:api"        { npm run build:api }
    "build:storefront" { npm run build:storefront }
    "build:admin"      { npm run build:admin }
    "lint"             { npm run lint }
    "typecheck"        { npm run typecheck }
    "test"             { npm run test }
    "db:migrate"       { Set-Location apps/api; npx prisma migrate deploy }
    "db:migrate:dev"   { Set-Location apps/api; npx prisma migrate dev }
    "db:seed"          { Set-Location apps/api; npx ts-node prisma/seed.ts }
    "db:studio"        { Set-Location apps/api; npx prisma studio }
    "db:generate"      { Set-Location apps/api; npx prisma generate }
    "docker:up"        { docker compose -f docker/docker-compose.yml up -d }
    "docker:down"      { docker compose -f docker/docker-compose.yml down }
    "docker:logs"      { docker compose -f docker/docker-compose.yml logs -f }
    "docker:reset"     { docker compose -f docker/docker-compose.yml down -v }
    "health"           { node scripts/health-check.js }
    "logs"             { docker compose -f docker/docker-compose.yml logs -f }
    default            {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
