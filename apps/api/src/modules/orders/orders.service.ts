import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, OrderStatus, PaymentStatus, FulfillmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId?: string;
    guestEmail?: string;
    orderType: 'STANDARD' | 'CUSTOM';
    customRequestId?: string;
    cart?: any;
    shippingAddress: any;
    billingAddress: any;
    shippingMethodId: string;
    shippingMethodName: string;
    shippingCost: number;
    taxAmount: number;
    subtotal: number;
    total: number;
    currency: string;
  }): Promise<Order> {
    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: data.userId,
        guestEmail: data.guestEmail,
        orderType: data.orderType,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        shippingSnapshot: data.shippingAddress as Prisma.InputJsonValue,
        billingSnapshot: data.billingAddress as Prisma.InputJsonValue,
        shippingMethodId: data.shippingMethodId,
        shippingMethodName: data.shippingMethodName,
        currency: data.currency,
        subtotal: data.subtotal,
        shippingCost: data.shippingCost,
        taxAmount: data.taxAmount,
        total: data.total,
        items: {
          create: (data.cart?.items ?? []).map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            productSnapshot: {
              name: item.product.name,
              slug: item.product.slug,
              sku: item.product.sku,
            } as Prisma.InputJsonValue,
            variantSnapshot: item.variant
              ? ({ name: item.variant.name, sku: item.variant.sku } as Prisma.InputJsonValue)
              : Prisma.DbNull,
            customization: item.customization as Prisma.InputJsonValue,
            quantity: item.quantity,
            unitPrice: item.priceSnapshot,
            totalPrice: Number(item.priceSnapshot) * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return order;
  }

  async updateStatus(
    orderId: string,
    updates: {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      fulfillmentStatus?: FulfillmentStatus;
    },
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...(updates.orderStatus && { orderStatus: updates.orderStatus }),
        ...(updates.paymentStatus && { paymentStatus: updates.paymentStatus }),
        ...(updates.fulfillmentStatus && { fulfillmentStatus: updates.fulfillmentStatus }),
        ...(updates.paymentStatus === PaymentStatus.PAID && { paidAt: new Date() }),
        ...(updates.orderStatus === OrderStatus.SHIPPED && { shippedAt: new Date() }),
        ...(updates.orderStatus === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(updates.orderStatus === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
      },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found.`);
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, payments: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderNumber} not found.`);
    return order;
  }

  async findAllForUser(userId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async findAll(params: {
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    skip?: number;
    take?: number;
  }): Promise<{ items: Order[]; total: number }> {
    const where: Prisma.OrderWhereInput = {
      ...(params.orderStatus && { orderStatus: params.orderStatus }),
      ...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: { items: true, payments: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total };
  }

  private async generateOrderNumber(): Promise<string> {
    const count = await this.prisma.order.count();
    return `ORD-${(count + 1).toString().padStart(6, '0')}`;
  }
}
