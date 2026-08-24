# Lean VPS deployment

This is the smallest supported deployment topology: one VPS runs PostgreSQL, Redis, API, storefront, admin and Nginx. Database and Redis are internal-only; only port 80 is published.

## Prerequisites

- Ubuntu/Debian VPS with Docker Engine and Docker Compose plugin
- At least 2 GB RAM and 25 GB disk
- Two DNS records pointing at the VPS: storefront and admin
- TLS terminated by Cloudflare (recommended) or a host-level TLS proxy. The bundled Nginx intentionally serves HTTP only.

## Deploy

```bash
git clone <your-repository-url> luxecraft
cd luxecraft
cp .env.vps.example .env.vps
# Edit .env.vps with the two real hostnames and strong unique secrets.
docker compose --env-file .env.vps -f docker-compose.vps.yml build
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d
```

The first start requires a Prisma migration. This repository currently needs its baseline migration committed before a fresh database can be initialized. Do not substitute `prisma db push` in production.

Once the migration exists, run:

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml exec api npx prisma migrate deploy --schema prisma/schema.prisma
docker compose --env-file .env.vps -f docker-compose.vps.yml exec api node seed/seed.js
```

Run the seed exactly once on a fresh database. It creates the Super Admin from `.env.vps` and sample catalog data; it never prints the password.

## Update

The easiest update command on your VPS is:

```bash
bash update.sh
```

It refuses to overwrite local server changes, fast-forwards to the latest `main` branch, rebuilds Docker images, restarts the stack, and shows container status.

The equivalent manual commands are:

```bash
git pull --ff-only origin main
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
```

Check status with `docker compose --env-file .env.vps -f docker-compose.vps.yml ps` and API health with `curl -H "Host: <storefront-host>" http://127.0.0.1/api/v1/health/ping`.

## Deliberately excluded

- No separate worker container: queues stay available for future work, but this initial bundle does not run background processors.
- No S3, email, payment gateway, or external monitoring service: configure each only after its integration is implemented.
