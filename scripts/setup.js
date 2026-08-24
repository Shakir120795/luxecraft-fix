#!/usr/bin/env node
/**
 * LuxeCraft — Setup Script
 * Verifies the environment and guides first-time setup.
 * Usage: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
let errors = 0;
let warnings = 0;

function ok(msg) { console.log(`  ✓  ${msg}`); }
function warn(msg) { console.warn(`  ⚠  ${msg}`); warnings++; }
function fail(msg) { console.error(`  ✗  ${msg}`); errors++; }
function section(title) { console.log(`\n── ${title} ──`); }

console.log('\n╔══════════════════════════════════╗');
console.log('║   LuxeCraft — Setup Verification ║');
console.log('╚══════════════════════════════════╝');

// ----- Node / npm -------------------------------------------
section('Runtime');
try {
  const nodeVer = process.version;
  const major = parseInt(nodeVer.slice(1));
  if (major >= 20) ok(`Node.js ${nodeVer}`);
  else warn(`Node.js ${nodeVer} — v20+ recommended`);
} catch { fail('Cannot determine Node.js version'); }

// ----- .env file --------------------------------------------
section('Environment');
const envPath = path.join(root, '.env');
const envExamplePath = path.join(root, '.env.example');
if (fs.existsSync(envPath)) {
  ok('.env file exists');
} else if (fs.existsSync(envExamplePath)) {
  warn('.env file not found — copying from .env.example');
  fs.copyFileSync(envExamplePath, envPath);
  warn('.env created from example — update values before running services');
} else {
  fail('.env and .env.example both missing');
}

// ----- Docker -----------------------------------------------
section('Docker');
try {
  execSync('docker --version', { stdio: 'pipe' });
  ok('Docker available');
  try {
    execSync('docker compose version', { stdio: 'pipe' });
    ok('Docker Compose available');
  } catch {
    warn('Docker Compose not found — required for local services');
  }
} catch {
  warn('Docker not found — required to run PostgreSQL and Redis locally');
  warn('Install Docker Desktop: https://www.docker.com/products/docker-desktop');
}

// ----- .ai docs ---------------------------------------------
section('Documentation');
const docs = [
  '.ai/PROJECT_SPEC.md',
  '.ai/ARCHITECTURE.md',
  '.ai/DEVELOPMENT_RULES.md',
  '.ai/DECISIONS.md',
  '.ai/CURRENT_STATE.md',
  '.ai/TASK_QUEUE.md',
  '.ai/DEVELOPMENT_PHASES.md',
];
for (const doc of docs) {
  if (fs.existsSync(path.join(root, doc))) ok(doc);
  else fail(`Missing: ${doc}`);
}

// ----- Result -----------------------------------------------
console.log('\n══════════════════════════════════════');
if (errors === 0 && warnings === 0) {
  console.log('  All checks passed. Ready to develop!');
} else {
  if (warnings > 0) console.warn(`  ${warnings} warning(s) above need attention.`);
  if (errors > 0) console.error(`  ${errors} error(s) above must be fixed.`);
}
console.log('\nNext steps:');
console.log('  1. npm run docker:up          — start PostgreSQL + Redis');
console.log('  2. npm run db:migrate:dev     — run Prisma migrations');
console.log('  3. npm run db:seed            — seed initial data');
console.log('  4. npm run dev:api            — start the NestJS API');
console.log('  5. npm run dev:storefront     — start the storefront');
console.log('  6. npm run dev:admin          — start the admin panel');
console.log('  7. npm run health             — verify health endpoint');
console.log('');
process.exit(errors > 0 ? 1 : 0);
