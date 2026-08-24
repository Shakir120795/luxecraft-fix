#!/usr/bin/env node
/**
 * LuxeCraft — Health Check Script
 * Calls the API health endpoint and reports status.
 * Usage: node scripts/health-check.js
 */

const http = require('http');

const API_PORT = process.env.API_PORT || 3001;
const url = `http://localhost:${API_PORT}/api/v1/health`;

console.log(`Checking health: ${url}`);

const req = http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const health = parsed.data || parsed;
      console.log('\n=== LuxeCraft Health Report ===');
      console.log(`Status:      ${health.status}`);
      console.log(`Environment: ${health.environment}`);
      console.log(`Timestamp:   ${health.timestamp}`);
      console.log('\nServices:');
      if (health.services) {
        for (const [name, info] of Object.entries(health.services)) {
          const s = info;
          const latency = s.latencyMs !== undefined ? ` (${s.latencyMs}ms)` : '';
          const detail = s.detail ? ` — ${s.detail}` : '';
          console.log(`  ${name}: ${s.status}${latency}${detail}`);
        }
      }
      console.log('\n');
      process.exit(health.status === 'healthy' ? 0 : 1);
    } catch {
      console.error('Failed to parse health response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error(`\nCannot reach API at ${url}`);
  console.error(`Error: ${err.message}`);
  console.error('Make sure the API is running: npm run dev:api\n');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('Health check timed out after 5s');
  req.destroy();
  process.exit(1);
});
