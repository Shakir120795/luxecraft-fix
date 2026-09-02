#!/usr/bin/env node

/**
 * Copy static assets for Next.js standalone build (Storefront)
 * 
 * This script runs automatically after `npm run build` in storefront.
 * It ensures .next/static is properly copied into the standalone directory.
 * 
 * Standalone structure:
 * .next/standalone/
 *   apps/
 *     storefront/
 *       server.js              ← entry point
 *       .next/
 *         static/              ← static assets MUST be here
 */

const fs = require('fs');
const path = require('path');

const STOREFRONT_DIR = path.join(__dirname, '..', 'apps', 'storefront');
const STATIC_SRC = path.join(STOREFRONT_DIR, '.next', 'static');
const STANDALONE_DIR = path.join(STOREFRONT_DIR, '.next', 'standalone', 'apps', 'storefront');
const STATIC_DEST = path.join(STANDALONE_DIR, '.next', 'static');

console.log('📦 LuxeCraft Storefront: Copying static assets for standalone build...\n');

// Check if standalone build exists
if (!fs.existsSync(STANDALONE_DIR)) {
  console.log('⚠️  Standalone directory not found. Skipping static asset copy.');
  console.log('   This is normal if not using standalone mode.\n');
  process.exit(0);
}

// Check if source static dir exists
if (!fs.existsSync(STATIC_SRC)) {
  console.error('❌ Error: .next/static directory not found!');
  console.error('   Build may have failed or not completed.\n');
  process.exit(1);
}

/**
 * Recursively copy directory
 */
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Create destination .next directory if needed
  const nextDestDir = path.join(STANDALONE_DIR, '.next');
  if (!fs.existsSync(nextDestDir)) {
    fs.mkdirSync(nextDestDir, { recursive: true });
  }

  // Copy static assets
  console.log(`Source:      ${STATIC_SRC}`);
  console.log(`Destination: ${STATIC_DEST}\n`);

  copyRecursive(STATIC_SRC, STATIC_DEST);

  console.log('✅ Static assets copied successfully!\n');
  console.log('Standalone build is ready:');
  console.log(`   node ${path.join(STANDALONE_DIR, 'server.js')}\n`);

} catch (error) {
  console.error('❌ Error copying static assets:', error.message);
  process.exit(1);
}
