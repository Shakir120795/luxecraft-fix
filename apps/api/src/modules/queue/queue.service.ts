import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, QueueName } from './queue.constants';

/**
 * QueueService manages BullMQ queues and their connections.
 *
 * Phase 1: Initializes queue infrastructure.
 * Workers and job processors are added in later phases as features require them.
 */
@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const connection = {
      host: this.config.get<string>('redis.host', 'localhost'),
      port: this.config.get<number>('redis.port', 6379),
      password: this.config.get<string | undefined>('redis.password'),
    };

    // Initialize all queues
    for (const name of Object.values(QUEUE_NAMES)) {
      const queue = new Queue(name, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      });
      this.queues.set(name, queue);
      this.logger.log(`Queue initialized: ${name}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      this.logger.log(`Queue closed: ${name}`);
    }
  }

  getQueue(name: QueueName): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue not found: ${name}`);
    }
    return queue;
  }

  async addJob<T>(
    queueName: QueueName,
    jobName: string,
    data: T,
    opts?: object,
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(jobName, data, opts);
    this.logger.debug(`Job added to queue [${queueName}]: ${jobName}`);
  }

  async getQueueCounts(): Promise<Record<string, object>> {
    const counts: Record<string, object> = {};
    for (const [name, queue] of this.queues.entries()) {
      counts[name] = await queue.getJobCounts();
    }
    return counts;
  }
}
