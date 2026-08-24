import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueService } from '../queue/queue.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    queues: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down';
  latencyMs?: number;
  detail?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
  ) {}

  async check(): Promise<HealthStatus> {
    const [database, redisHealth, queues] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues(),
    ]);

    const allUp = database.status === 'up' && redisHealth.status === 'up' && queues.status === 'up';
    const anyDown = database.status === 'down' || redisHealth.status === 'down';

    return {
      status: allUp ? 'healthy' : anyDown ? 'degraded' : 'degraded',
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis: redisHealth,
        queues,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      this.logger.warn('Database health check failed', error);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        detail: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const pong = await this.redis.ping();
      return {
        status: pong === 'PONG' ? 'up' : 'down',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      this.logger.warn('Redis health check failed', error);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        detail: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkQueues(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const counts = await this.queueService.getQueueCounts();
      return {
        status: 'up',
        latencyMs: Date.now() - start,
        detail: `${Object.keys(counts).length} queues active`,
      };
    } catch (error) {
      this.logger.warn('Queue health check failed', error);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        detail: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
