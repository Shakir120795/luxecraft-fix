import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, FulfillmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { orderStatus?: string; paymentStatus?: string; search?: string; skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const where: Prisma.OrderWhereInput = {
      paymentStatus: (params.paymentStatus as any) || PaymentStatus.PAID,
      ...(params.orderStatus && { orderStatus: params.orderStatus as any }),
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

  async updateStatus(
    id: string,
    orderStatus?: OrderStatus,
    fulfillmentStatus?: FulfillmentStatus,
  ): Promise<any> {
    const updates: Prisma.OrderUpdateInput = {};

    if (orderStatus !== undefined) {
      if (!Object.values(OrderStatus).includes(orderStatus)) {
        throw new BadRequestException(`Invalid order status: ${orderStatus}`);
      }
      updates.orderStatus = orderStatus;
    }

    if (fulfillmentStatus !== undefined) {
      if (!Object.values(FulfillmentStatus).includes(fulfillmentStatus)) {
        throw new BadRequestException(`Invalid fulfillment status: ${fulfillmentStatus}`);
      }
      updates.fulfillmentStatus = fulfillmentStatus;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('At least one order or fulfillment status is required.');
    }

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
