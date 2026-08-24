import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(data: {
    eventType: string;
    userId?: string;
    sessionId?: string;
    productId?: string;
    categoryId?: string;
    orderId?: string;
    country?: string;
    device?: string;
    browser?: string;
    referrer?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventType: data.eventType,
          userId: data.userId,
          sessionId: data.sessionId,
          productId: data.productId,
          categoryId: data.categoryId,
          orderId: data.orderId,
          country: data.country,
          device: data.device,
          browser: data.browser,
          referrer: data.referrer,
          metadata: data.metadata ? (data.metadata as any) : undefined,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to track event: ${data.eventType}`, err);
      // Don't throw — analytics should never break main flow
    }
  }

  async getConversionFunnel(days: number = 7): Promise<any> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: date } },
      _count: { id: true },
    });

    return events.map((e) => ({ type: e.eventType, count: e._count.id }));
  }

  async getTopProducts(days: number = 7, limit: number = 10): Promise<any> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: { eventType: 'PRODUCT_VIEWED', createdAt: { gte: date }, productId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return events;
  }

  async getRevenueMetrics(days: number = 7): Promise<any> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const orders = await this.prisma.order.aggregate({
      where: { createdAt: { gte: date }, paymentStatus: 'PAID' },
      _sum: { total: true },
      _count: { id: true },
    });

    return {
      totalRevenue: orders._sum.total ?? 0,
      orderCount: orders._count.id,
      averageOrderValue: orders._count.id > 0 ? (Number(orders._sum.total ?? 0) / orders._count.id).toFixed(2) : 0,
    };
  }

  async getAbandonedCarts(days: number = 7, limit: number = 50): Promise<any[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    // Find carts with CHECKOUT_STARTED but no PURCHASE_COMPLETED
    const abandonedSessions = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'CHECKOUT_STARTED',
        createdAt: { gte: date },
        sessionId: { not: null },
      },
      select: { sessionId: true },
      distinct: ['sessionId'],
      take: limit,
    });

    return abandonedSessions;
  }
}
