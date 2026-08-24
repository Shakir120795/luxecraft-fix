import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTodayStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, todayRevenue, newCustomers, failedPayments, lowStockAlerts, pendingCustomRequests, pendingQuotes] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow }, orderStatus: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, paymentStatus: PaymentStatus.PAID },
        _sum: { total: true },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.payment.count({
        where: { createdAt: { gte: today, lt: tomorrow }, status: PaymentStatus.FAILED },
      }),
      this.prisma.productVariant.count({
        where: {
          stockQty: { lt: this.prisma.productVariant.fields.lowStockAt ?? 5 },
        },
      }),
      this.prisma.customRequest.count({
        where: { status: 'SUBMITTED' },
      }),
      this.prisma.customQuote.count({
        where: { status: 'DRAFT' },
      }),
    ]);

    return {
      todayOrders,
      todayRevenue: todayRevenue._sum.total ?? 0,
      newCustomers,
      alerts: {
        failedPayments,
        lowStockItems: lowStockAlerts,
        pendingCustomRequests,
        pendingQuotes,
      },
    };
  }

  async getRecentOrders(limit: number = 10): Promise<any[]> {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, firstName: true, lastName: true } }, payments: true },
    });
  }

  async getTopProducts(limit: number = 5): Promise<any[]> {
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const productIds = topProducts.map((p) => p.productId).filter((id) => id !== null) as string[];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    return products;
  }

  async getOrderStats(): Promise<any> {
    const [pending, paymentConfirmed, processing, shipped, delivered] = await Promise.all([
      this.prisma.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { orderStatus: OrderStatus.PAYMENT_CONFIRMED } }),
      this.prisma.order.count({ where: { orderStatus: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { orderStatus: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { orderStatus: OrderStatus.DELIVERED } }),
    ]);

    return { pending, paymentConfirmed, processing, shipped, delivered };
  }
}
