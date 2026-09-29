import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AdminNotificationsService } from '../admin-notifications/admin-notifications.service';
import { Order, Payment, OrderStatus, PaymentStatus, FulfillmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: AdminNotificationsService,
  ) {}

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
    discountAmount?: number;
    total: number;
    currency: string;
  }): Promise<Order> {
    let order: Order | undefined;

    for (let attempt = 0; attempt < 10 && !order; attempt += 1) {
      const orderNumber = await this.generateOrderNumber();

      try {
        order = await this.prisma.order.create({
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
        discountAmount: data.discountAmount ?? 0,
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
              color: item.product.color,
              material: item.product.material,
              style: item.product.style,
              collection: item.product.collection,
              origin: item.product.origin,
              productNote: item.product.productNote,
              dimensions: {
                lengthCm: item.product.lengthCm,
                widthCm: item.product.widthCm,
                heightCm: item.product.heightCm,
                weightKg: item.product.weightKg,
              },
              images: (item.product.media ?? []).map((media: any) => ({
                url: media.url,
                altText: media.altText,
                isMain: media.isMain,
                sortOrder: media.sortOrder,
              })),
            } as Prisma.InputJsonValue,
            variantSnapshot: item.variant
              ? ({
                  id: item.variant.id,
                  name: item.variant.name,
                  sku: item.variant.sku,
                  dimensions: {
                    lengthCm: item.variant.lengthCm,
                    widthCm: item.variant.widthCm,
                    heightCm: item.variant.heightCm,
                    weightKg: item.variant.weightKg,
                  },
                  images: (item.variant.media ?? []).map((media: any) => ({
                    url: media.url,
                    altText: media.altText,
                    isMain: media.isMain,
                    sortOrder: media.sortOrder,
                  })),
                } as Prisma.InputJsonValue)
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
      } catch (error) {
        const isOrderNumberConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';

        if (!isOrderNumberConflict || attempt === 9) {
          throw error;
        }

        this.logger.warn(
          `Order number collision detected; retrying order creation (attempt ${attempt + 2}/10)`,
        );
      }
    }

    if (!order) {
      throw new BadRequestException('Unable to generate a unique order number. Please try again.');
    }

    const admin = await this.prisma.adminUser.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (admin) {
      await this.notifications.send({
        recipientId: admin.id,
        type: 'NEW_ORDER',
        title: `New Order: ${order.orderNumber}`,
        message:
          `Order: ${order.orderNumber}\n` +
          `Type: ${order.orderType}\n` +
          `Total: ${order.total} ${order.currency}\n` +
          `Status: ${order.orderStatus}`,
        relatedId: order.id,
      });
    }
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
    return (await this.attachProductDetails([order]))[0];
  }

  async findOneForUser(id: string, userId: string): Promise<Order & { payments: Payment[] }> {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, payments: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found.`);
    return (await this.attachProductDetails([order]))[0] as Order & { payments: Payment[] };
  }

  async cancelForUser(id: string, userId: string): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, payments: true },
    });

    if (!order) throw new NotFoundException(`Order ${id} not found.`);

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('A paid order cannot be cancelled as an unpaid order.');
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      return order;
    }

    const cancellablePaymentStatuses: PaymentStatus[] = [
      PaymentStatus.PENDING,
      PaymentStatus.FAILED,
      PaymentStatus.AUTHORIZED,
    ];
    if (!cancellablePaymentStatuses.includes(order.paymentStatus)) {
      throw new BadRequestException('This order cannot be cancelled.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (order.paymentStatus === PaymentStatus.PENDING || order.paymentStatus === PaymentStatus.AUTHORIZED) {
        for (const item of order.items) {
          if (!item.variantId) continue;

          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant?.trackInventory) continue;

          const released = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              reservedQty: { gte: item.quantity },
            },
            data: { reservedQty: { decrement: item.quantity } },
          });

          if (released.count > 0) {
            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                variantId: item.variantId,
                changeType: 'ORDER_RELEASE',
                delta: item.quantity,
                qtyBefore: variant.stockQty,
                qtyAfter: variant.stockQty,
                reason: `Order ${order.orderNumber} - Customer cancelled`,
                reference: order.id,
              },
            });
          }
        }
      }

      await tx.payment.updateMany({
        where: { orderId: order.id, status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] } },
        data: { status: PaymentStatus.CANCELLED },
      });

      return tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          paymentStatus: order.paymentStatus === PaymentStatus.FAILED ? PaymentStatus.FAILED : PaymentStatus.CANCELLED,
          customerNotes: 'Cancelled by customer',
          cancelledAt: new Date(),
        },
      });
    });
  }

  async findOneForGuest(id: string, accessToken: string): Promise<Order & { payments: Payment[] }> {
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
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    if (orders.length === 0) return [];

    const customerCancellationLogs = await this.prisma.inventoryLog.findMany({
      where: {
        reference: { in: orders.map((order) => order.id) },
        reason: { contains: 'Customer cancelled', mode: 'insensitive' },
      },
      select: { reference: true },
    });

    const customerCancelledOrderIds = new Set(
      customerCancellationLogs
        .map((entry) => entry.reference)
        .filter((reference): reference is string => Boolean(reference)),
    );

    const visibleOrders = orders.filter(
      (order) =>
        order.paymentStatus === PaymentStatus.PAID ||
        (order.orderStatus === OrderStatus.CANCELLED &&
          (customerCancelledOrderIds.has(order.id) ||
            (order.customerNotes ?? '').toLowerCase().includes('cancelled by customer'))),
    );

    return this.attachProductDetails(visibleOrders);
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

  private async attachProductDetails<T extends { items?: any[] }>(orders: T[]): Promise<T[]> {
    const productIds = Array.from(
      new Set(
        orders.flatMap((order) =>
          (order.items ?? [])
            .map((item: any) => item.productId)
            .filter((id: any): id is string => typeof id === 'string' && id.length > 0),
        ),
      ),
    );

    if (productIds.length === 0) return orders;

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        color: true,
        material: true,
        style: true,
        collection: true,
        origin: true,
        productNote: true,
        lengthCm: true,
        widthCm: true,
        heightCm: true,
        weightKg: true,
        media: {
          where: { type: 'IMAGE' },
          orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
          select: { url: true, altText: true, isMain: true, sortOrder: true },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            lengthCm: true,
            widthCm: true,
            heightCm: true,
            weightKg: true,
            media: {
              where: { type: 'IMAGE' },
              orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
              select: { url: true, altText: true, isMain: true, sortOrder: true },
            },
          },
        },
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    return orders.map((order) => ({
      ...order,
      items: (order.items ?? []).map((item: any) => {
        const snapshot =
          item.productSnapshot &&
          typeof item.productSnapshot === 'object' &&
          !Array.isArray(item.productSnapshot)
            ? (item.productSnapshot as Record<string, any>)
            : {};
        const variantSnapshot =
          item.variantSnapshot &&
          typeof item.variantSnapshot === 'object' &&
          !Array.isArray(item.variantSnapshot)
            ? (item.variantSnapshot as Record<string, any>)
            : {};
        const product = item.productId ? productMap.get(item.productId) : undefined;
        const variant = product?.variants.find((entry) => entry.id === item.variantId);

        const currentVariantImages = variant?.media?.map((media) => media.url) ?? [];
        const currentProductImages = product?.media?.map((media) => media.url) ?? [];
        const snapshotVariantImages = Array.isArray(variantSnapshot.images)
          ? variantSnapshot.images.map((media: any) => media?.url).filter((url: any): url is string => typeof url === 'string')
          : [];
        const snapshotProductImages = Array.isArray(snapshot.images)
          ? snapshot.images.map((media: any) => media?.url).filter((url: any): url is string => typeof url === 'string')
          : [];

        return {
          ...item,
          product: {
            id: product?.id ?? item.productId ?? '',
            name: product?.name ?? snapshot.name ?? 'Product',
            slug: product?.slug ?? snapshot.slug ?? '',
            sku: variant?.sku ?? product?.sku ?? variantSnapshot.sku ?? snapshot.sku ?? '',
            color: product?.color ?? snapshot.color ?? null,
            material: product?.material ?? snapshot.material ?? null,
            style: product?.style ?? snapshot.style ?? null,
            collection: product?.collection ?? snapshot.collection ?? null,
            origin: product?.origin ?? snapshot.origin ?? null,
            productNote: product?.productNote ?? snapshot.productNote ?? null,
            dimensions: {
              lengthCm: variant?.lengthCm ?? snapshot.dimensions?.lengthCm ?? product?.lengthCm ?? null,
              widthCm: variant?.widthCm ?? snapshot.dimensions?.widthCm ?? product?.widthCm ?? null,
              heightCm: variant?.heightCm ?? snapshot.dimensions?.heightCm ?? product?.heightCm ?? null,
              weightKg: variant?.weightKg ?? snapshot.dimensions?.weightKg ?? product?.weightKg ?? null,
            },
            images: currentVariantImages.length
              ? currentVariantImages
              : currentProductImages.length
                ? currentProductImages
                : (snapshotVariantImages.length ? snapshotVariantImages : snapshotProductImages),
            variant: item.variantId
              ? {
                  id: variant?.id ?? item.variantId,
                  name: variant?.name ?? variantSnapshot.name ?? null,
                  sku: variant?.sku ?? variantSnapshot.sku ?? null,
                  dimensions: {
                    lengthCm: variant?.lengthCm ?? variantSnapshot.dimensions?.lengthCm ?? null,
                    widthCm: variant?.widthCm ?? variantSnapshot.dimensions?.widthCm ?? null,
                    heightCm: variant?.heightCm ?? variantSnapshot.dimensions?.heightCm ?? null,
                    weightKg: variant?.weightKg ?? variantSnapshot.dimensions?.weightKg ?? null,
                  },
                }
              : null,
          },
        };
      }),
    }));
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
