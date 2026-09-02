#!/usr/bin/env node

/**
 * LuxeCraft Storefront - Production Server Wrapper
 * 
 * This wrapper ensures the Next.js standalone server starts with
 * the correct port from environment variable or default.
 * 
 * Usage:
 *   node server-production.js
 * 
 * Environment variables:
 *   STOREFRONT_PORT or PORT - Port to listen on (default: 3003)
 *   NODE_ENV - Should be "production"
 */

const { spawn } = require('child_process');
const path = require('path');

// Determine port
const PORT = process.env.STOREFRONT_PORT || process.env.PORT || '3003';

// Ensure NODE_ENV is production
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Path to standalone server
const SERVER_PATH = path.join(__dirname, '.next', 'standalone', 'apps', 'storefront', 'server.js');

console.log('🚀 LuxeCraft Storefront - Production Server');
console.log(`   Port: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   Server: ${SERVER_PATH}\n`);

// Start the standalone server with PORT environment variable
const server = spawn('node', [SERVER_PATH], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: PORT,
    HOSTNAME: '0.0.0.0', // Listen on all interfaces (important for Docker/VPS)
  },
});

// Handle server exit
server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination signals
process.on('SIGTERM', () => {
  console.log('\n📴 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n📴 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});
