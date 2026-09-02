import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Production port configuration
  // Standalone server respects PORT environment variable
  env: {
    STOREFRONT_PORT: process.env.STOREFRONT_PORT || process.env.PORT || '3003',
  },
  
  // API rewrites — proxy /api/* to the NestJS backend during development
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
