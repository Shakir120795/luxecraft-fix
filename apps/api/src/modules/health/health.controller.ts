import { Controller, Get, Version } from '@nestjs/common';
import { HealthService } from './health.service';

/**
 * Health check endpoints.
 * GET /api/v1/health       — full health status
 * GET /api/v1/health/ping  — simple liveness probe
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version('1')
  async check() {
    return this.healthService.check();
  }

  @Get('ping')
  @Version('1')
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
