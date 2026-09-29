import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, FulfillmentStatus, Prisma } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { AdminRefundMode, ProcessAdminRefundDto } from './dto/process-admin-refund.dto';

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async findAll(params: { orderStatus?: string; paymentStatus?: string; search?: string; skip?: number; take?: number }): Promise<{ items: any[]; total: number }> {
    const baseWhere: Prisma.OrderWhereInput = {
      ...(params.search && {
        OR: [
          { orderNumber: { contains: params.search, mode: 'insensitive' } },
          { guestEmail: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const where: Prisma.OrderWhereInput = {
      ...baseWhere,
      ...(params.orderStatus
        ? { orderStatus: params.orderStatus as any }
        : params.paymentStatus
          ? { paymentStatus: params.paymentStatus as any }
          : {
              OR: [
                { paymentStatus: PaymentStatus.PAID },
                { orderStatus: OrderStatus.CANCELLED },
              ],
            }),
    };

    const [items, rawTotal] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          payments: true,
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    let orders = items;
    if (!params.orderStatus && !params.paymentStatus) {
      const cancelledIds = orders
        .filter((order) => order.orderStatus === OrderStatus.CANCELLED)
        .map((order) => order.id);

      if (cancelledIds.length > 0) {
        const customerCancellationLogs = await this.prisma.inventoryLog.findMany({
          where: {
            reference: { in: cancelledIds },
            reason: { contains: 'Customer cancelled', mode: 'insensitive' },
          },
          select: { reference: true },
        });

        const customerCancelledIds = new Set(
          customerCancellationLogs
            .map((entry) => entry.reference)
            .filter((reference): reference is string => Boolean(reference)),
        );

        orders = orders.filter(
          (order) =>
            order.paymentStatus === PaymentStatus.PAID ||
            (order.orderStatus === OrderStatus.CANCELLED &&
              (customerCancelledIds.has(order.id) ||
                (order.customerNotes ?? '').toLowerCase().includes('cancelled by customer'))),
        );
      }
    }

    return {
      items: await this.attachProductDetails(orders),
      total: params.orderStatus || params.paymentStatus ? rawTotal : orders.length,
    };
  }
  async findOne(id: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, items: true, payments: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found.`);
    return (await this.attachProductDetails([order]))[0];
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
            ? (item.productSnapshot as Record<string, unknown>)
            : {};
        const variantSnapshot =
          item.variantSnapshot &&
          typeof item.variantSnapshot === 'object' &&
          !Array.isArray(item.variantSnapshot)
            ? (item.variantSnapshot as Record<string, unknown>)
            : {};
        const product = item.productId ? productMap.get(item.productId) : undefined;
        const variant = product?.variants.find((entry) => entry.id === item.variantId);

        const snapshotImages = Array.isArray(snapshot.images)
          ? snapshot.images.filter((value): value is string => typeof value === 'string')
          : [];
        const currentImages = variant?.media?.map((media) => media.url) ?? [];
        const productImages = product?.media?.map((media) => media.url) ?? [];

        const snapshotVariantImages = Array.isArray(variantSnapshot.images)
          ? variantSnapshot.images
              .map((media: any) => media?.url)
              .filter((url: any): url is string => typeof url === 'string')
          : [];

        return {
          ...item,
          product: {
            id: product?.id ?? item.productId ?? '',
            name:
              product?.name ??
              (typeof snapshot.name === 'string' ? snapshot.name : 'Product'),
            slug:
              product?.slug ??
              (typeof snapshot.slug === 'string' ? snapshot.slug : ''),
            sku:
              variant?.sku ??
              product?.sku ??
              (typeof variantSnapshot.sku === 'string'
                ? variantSnapshot.sku
                : typeof snapshot.sku === 'string'
                  ? snapshot.sku
                  : ''),
            color:
              product?.color ??
              (typeof snapshot.color === 'string' ? snapshot.color : null),
            material:
              product?.material ??
              (typeof snapshot.material === 'string' ? snapshot.material : null),
            style:
              product?.style ??
              (typeof snapshot.style === 'string' ? snapshot.style : null),
            collection:
              product?.collection ??
              (typeof snapshot.collection === 'string' ? snapshot.collection : null),
            origin:
              product?.origin ??
              (typeof snapshot.origin === 'string' ? snapshot.origin : null),
            productNote:
              product?.productNote ??
              (typeof snapshot.productNote === 'string' ? snapshot.productNote : null),
            dimensions: {
              lengthCm:
                variant?.lengthCm ??
                (snapshot.dimensions as any)?.lengthCm ??
                product?.lengthCm ??
                null,
              widthCm:
                variant?.widthCm ??
                (snapshot.dimensions as any)?.widthCm ??
                product?.widthCm ??
                null,
              heightCm:
                variant?.heightCm ??
                (snapshot.dimensions as any)?.heightCm ??
                product?.heightCm ??
                null,
              weightKg:
                variant?.weightKg ??
                (snapshot.dimensions as any)?.weightKg ??
                product?.weightKg ??
                null,
            },
            images: currentImages.length
              ? currentImages
              : productImages.length
                ? productImages
                : snapshotImages.length
                  ? snapshotImages
                  : snapshotVariantImages,
            variant: item.variantId
              ? {
                  id: variant?.id ?? item.variantId,
                  name:
                    variant?.name ??
                    (typeof variantSnapshot.name === 'string'
                      ? variantSnapshot.name
                      : null),
                  sku:
                    variant?.sku ??
                    (typeof variantSnapshot.sku === 'string'
                      ? variantSnapshot.sku
                      : null),
                  dimensions: {
                    lengthCm:
                      variant?.lengthCm ??
                      (variantSnapshot.dimensions as any)?.lengthCm ??
                      null,
                    widthCm:
                      variant?.widthCm ??
                      (variantSnapshot.dimensions as any)?.widthCm ??
                      null,
                    heightCm:
                      variant?.heightCm ??
                      (variantSnapshot.dimensions as any)?.heightCm ??
                      null,
                    weightKg:
                      variant?.weightKg ??
                      (variantSnapshot.dimensions as any)?.weightKg ??
                      null,
                  },
                }
              : null,
          },
        };
      }),
    }));
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

  async processRefund(orderId: string, data: ProcessAdminRefundDto): Promise<any> {
    const order = await this.findOne(orderId);
    const refundablePayments = order.payments.filter((payment: any) => {
      const remaining = Number(payment.amount) - Number(payment.refundedAmount);
      return (
        [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED].includes(payment.status) &&
        remaining > 0.01
      );
    });

    if (refundablePayments.length !== 1) {
      throw new BadRequestException(
        'Refund requires exactly one paid payment with a refundable balance.',
      );
    }

    const payment = refundablePayments[0];
    const originalAmount = Number(payment.amount);
    const alreadyRefunded = Number(payment.refundedAmount);
    const remainingAmount = originalAmount - alreadyRefunded;
    const refundAmount = Number(data.refundAmount);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero.');
    }

    if (refundAmount > remainingAmount + 0.01) {
      throw new BadRequestException(
        `Refund amount exceeds the remaining refundable amount of ${Math.max(remainingAmount, 0).toFixed(2)}.`,
      );
    }

    let refundedPayment: any;

    if (data.mode === AdminRefundMode.MANUAL) {
      const manualReference = data.manualReference?.trim();
      if (!manualReference) {
        throw new BadRequestException(
          'Manual refund requires a reference number or transaction ID.',
        );
      }

      const newRefundedAmount = alreadyRefunded + refundAmount;
      const isFullRefund = newRefundedAmount >= originalAmount - 0.01;
      const existingMetadata =
        payment.metadata &&
        typeof payment.metadata === 'object' &&
        !Array.isArray(payment.metadata)
          ? (payment.metadata as Record<string, unknown>)
          : {};
      const refundHistory = Array.isArray(existingMetadata.refunds)
        ? existingMetadata.refunds
        : [];

      refundedPayment = await this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            refundedAmount: isFullRefund ? originalAmount : newRefundedAmount,
            status: isFullRefund
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PARTIALLY_REFUNDED,
            refundedAt: new Date(),
            metadata: {
              ...existingMetadata,
              refunds: [
                ...refundHistory,
                {
                  source: 'MANUAL',
                  reference: manualReference,
                  note: data.note?.trim() || null,
                  amount: refundAmount,
                  currency: payment.currency,
                  createdAt: new Date().toISOString(),
                },
              ],
            } as Prisma.InputJsonValue,
          },
        });

        await this.syncOrderRefundState(tx, order, isFullRefund);
        return updatedPayment;
      });

      this.logger.warn(
        `Manual refund recorded for payment ${payment.id}: ${refundAmount} ${payment.currency}, reference ${manualReference}`,
      );
    } else {
      refundedPayment = await this.payments.refund(payment.id, refundAmount);
      const isFullRefund =
        Number(refundedPayment.refundedAmount) >= originalAmount - 0.01;

      await this.prisma.$transaction(async (tx) => {
        await this.syncOrderRefundState(tx, order, isFullRefund);
      });

      this.logger.log(
        `Gateway refund completed for payment ${payment.id}: ${refundAmount} ${payment.currency}`,
      );
    }

    return this.findOne(orderId);
  }

  private async syncOrderRefundState(
    tx: Prisma.TransactionClient,
    order: any,
    isFullRefund: boolean,
  ): Promise<void> {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: isFullRefund
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED,
        ...(isFullRefund && { orderStatus: OrderStatus.REFUNDED }),
      },
    });

    if (!isFullRefund) return;

    for (const item of order.items ?? []) {
      if (!item.variantId) continue;

      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (!variant?.trackInventory) continue;

      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stockQty: {
            increment: item.quantity,
          },
        },
      });

      await tx.inventoryLog.create({
        data: {
          variantId: variant.id,
          changeType: 'RETURN_RESTOCK',
          delta: item.quantity,
          qtyBefore: variant.stockQty,
          qtyAfter: variant.stockQty + item.quantity,
          reason: `Order ${order.orderNumber} - Full refund`,
          reference: order.id,
        },
      });
    }
  }
}
