const { rmSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = process.argv[2];
const allowedApps = new Set(['storefront', 'admin']);

if (!allowedApps.has(app)) {
  console.error('Usage: node scripts/clear-next-cache.js <storefront|admin>');
  process.exit(1);
}

const cachePath = join(root, 'apps', app, '.next');
rmSync(cachePath, { recursive: true, force: true });
console.log(`Cleared ${app} Next.js cache.`);
