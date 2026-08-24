import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { orderStatus?: string; paymentStatus?: string; search?: string; skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const where: Prisma.OrderWhereInput = {
      ...(params.orderStatus && { orderStatus: params.orderStatus as any }),
      ...(params.paymentStatus && { paymentStatus: params.paymentStatus as any }),
      ...(params.search && {
        OR: [
          { orderNumber: { contains: params.search, mode: 'insensitive' } },
          { guestEmail: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } }, payments: true, items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: true, items: true, payments: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found.`);
    return order;
  }

  async updateStatus(id: string, orderStatus?: string, paymentStatus?: string, fulfillmentStatus?: string): Promise<any> {
    const updates: any = {};
    if (orderStatus) updates.orderStatus = orderStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (fulfillmentStatus) updates.fulfillmentStatus = fulfillmentStatus;

    return this.prisma.order.update({
      where: { id },
      data: updates,
    });
  }

  async cancelOrder(id: string): Promise<any> {
    return this.prisma.order.update({
      where: { id },
      data: { orderStatus: OrderStatus.CANCELLED, cancelledAt: new Date() },
    });
  }

  async processRefund(orderId: string, refundAmount: number): Promise<any> {
    const order = await this.findOne(orderId);
    const payment = order.payments[0];
    if (!payment) throw new NotFoundException('No payment found for order.');

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { refundedAmount: refundAmount, status: 'PARTIALLY_REFUNDED', refundedAt: new Date() },
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.PARTIALLY_REFUNDED },
    });
  }
}
