import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
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

  async findOneForUser(id: string, userId: string): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, payments: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found.`);
    return order;
  }

  async findOneForGuest(id: string, accessToken: string): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where: { id, userId: null },
      include: { items: true, payments: true },
    });
    if (!order || !this.verifyGuestAccessToken(order.id, order.guestEmail, accessToken)) {
      throw new NotFoundException(`Order ${id} not found.`);
    }
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

  createGuestAccessToken(order: Pick<Order, 'id' | 'guestEmail'>): string {
    if (!order.guestEmail) throw new Error('A guest email is required.');
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    const signature = this.signGuestAccess(`${order.id}.${order.guestEmail.toLowerCase()}.${expiresAt}`);
    return `${expiresAt}.${signature}`;
  }

  private verifyGuestAccessToken(orderId: string, guestEmail: string | null, token: string): boolean {
    if (!guestEmail) return false;
    const [expiresAt, signature] = token.split('.');
    if (!expiresAt || !signature || !/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now() / 1000) return false;
    const expected = this.signGuestAccess(`${orderId}.${guestEmail.toLowerCase()}.${expiresAt}`);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
  }

  private signGuestAccess(value: string): string {
    const secret = process.env.GUEST_ORDER_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error('GUEST_ORDER_ACCESS_SECRET must be configured.');
    return createHmac('sha256', secret).update(value).digest('base64url');
  }
}
