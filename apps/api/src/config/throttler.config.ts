import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  // Stricter limits for auth endpoints (applied per-route via @Throttle)
  authTtl: 60,
  authLimit: 10,
}));
