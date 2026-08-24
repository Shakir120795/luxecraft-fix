#!/usr/bin/env bash
set -euo pipefail

# LuxeCraft production update helper for a Linux VPS / Google Cloud Shell.
# Run from the repository root: bash update.sh

if [[ ! -f .env.vps ]]; then
  echo "Missing .env.vps. Copy .env.vps.example and configure it before deploying."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Local changes found. Commit or stash them before updating."
  exit 1
fi

git pull --ff-only origin main
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
docker compose --env-file .env.vps -f docker-compose.vps.yml ps

echo "Update complete. Health check: curl -H 'Host: <storefront-host>' http://127.0.0.1/api/v1/health/ping"
