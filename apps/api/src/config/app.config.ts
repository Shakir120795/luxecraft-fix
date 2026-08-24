import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3001', 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
    'http://localhost:3000',
    'http://localhost:3002',
  ],
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  logLevel: process.env.LOG_LEVEL ?? 'debug',
}));
