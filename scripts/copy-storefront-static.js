#!/usr/bin/env node

/**
 * Copy static/public assets into the exact Next.js standalone runtime root.
 * Next.js can emit either a flat or nested standalone layout for a workspace build.
 */

const fs = require('fs');
const path = require('path');

const STOREFRONT_DIR = path.join(__dirname, '..', 'apps', 'storefront');
const STATIC_SRC = path.join(STOREFRONT_DIR, '.next', 'static');
const PUBLIC_SRC = path.join(STOREFRONT_DIR, 'public');
const STANDALONE_ROOT = path.join(STOREFRONT_DIR, '.next', 'standalone');

const nestedRuntime = path.join(STANDALONE_ROOT, 'apps', 'storefront');
const flatRuntime = STANDALONE_ROOT;
const RUNTIME_DIR = fs.existsSync(path.join(nestedRuntime, 'server.js')) ? nestedRuntime : flatRuntime;
const STATIC_DEST = path.join(RUNTIME_DIR, '.next', 'static');
const PUBLIC_DEST = path.join(RUNTIME_DIR, 'public');

console.log('📦 Wolhomes Storefront: preparing standalone runtime...');
console.log('Runtime:     ' + RUNTIME_DIR);
console.log('Static src:  ' + STATIC_SRC);
console.log('Static dest: ' + STATIC_DEST);

if (!fs.existsSync(path.join(STANDALONE_ROOT, 'server.js')) && !fs.existsSync(path.join(nestedRuntime, 'server.js'))) {
  console.error('❌ Standalone server.js not found.');
  process.exit(1);
}

if (!fs.existsSync(STATIC_SRC)) {
  console.error('❌ Error: .next/static directory not found.');
  process.exit(1);
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

try {
  copyRecursive(STATIC_SRC, STATIC_DEST);
  if (fs.existsSync(PUBLIC_SRC)) {
    copyRecursive(PUBLIC_SRC, PUBLIC_DEST);
    console.log('Public dest:  ' + PUBLIC_DEST);
  }
  console.log('✅ Standalone assets ready.');
} catch (error) {
  console.error('❌ Error preparing standalone assets:', error.message);
  process.exit(1);
}
