import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
