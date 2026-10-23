import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Pin the tracing root to the monorepo root. Without this, Next stops at
  // the stray apps/storefront/package-lock.json and emits a FLAT standalone
  // (server.js at the standalone root), while the Dockerfile starts
  // apps/storefront/server.js — the container then crash-loops with
  // MODULE_NOT_FOUND and nginx serves 502.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  
  // Production port configuration
  // Standalone server respects PORT environment variable
  env: {
    STOREFRONT_PORT: process.env.STOREFRONT_PORT || process.env.PORT || '3003',
  },
  
  // API rewrites  proxy /api/* to the NestJS backend during development
  async rewrites() {
    const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001/api/v1';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
