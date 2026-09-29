import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_EXPIRY_MINUTES = 30;
const DEFAULT_INTERVAL_MINUTES = 5;

@Injectable()
export class PendingOrderCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PendingOrderCleanupService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    void this.cleanupExpiredPendingOrders();

    const intervalMs = this.getIntervalMinutes() * 60 * 1000;
    this.timer = setInterval(() => {
      void this.cleanupExpiredPendingOrders();
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async cleanupExpiredPendingOrders(): Promise<number> {
    if (this.running) return 0;
    this.running = true;

    try {
      const cutoff = new Date(Date.now() - this.getExpiryMinutes() * 60 * 1000);

      const orders = await this.prisma.order.findMany({
        where: {
          orderType: 'STANDARD',
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
        include: {
          items: {
            select: {
              productId: true,
              variantId: true,
              quantity: true,
            },
          },
          payments: {
            where: {
              status: {
                in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED],
              },
            },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      });

      let cleaned = 0;

      for (const order of orders) {
        const pendingPayment = order.payments[0];
        const isExpired =
          pendingPayment
            ? pendingPayment.updatedAt < cutoff
            : order.createdAt < cutoff;

        if (!isExpired) continue;

        const didCleanup = await this.cleanupOrder(order.id, order.items);
        if (didCleanup) cleaned += 1;
      }

      if (cleaned > 0) {
        this.logger.log(`Expired ${cleaned} pending order reservation(s).`);
      }

      return cleaned;
    } catch (error) {
      this.logger.error(
        `Pending order cleanup failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return 0;
    } finally {
      this.running = false;
    }
  }

  private async cleanupOrder(
    orderId: string,
    items: Array<{
      productId: string | null;
      variantId: string | null;
      quantity: number;
    }>,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      // Claim the pending payment first. A concurrent successful payment
      // callback changes it to PAID, causing this conditional update to fail.
      const paymentClaim = await tx.payment.updateMany({
        where: {
          orderId,
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED],
          },
        },
        data: {
          status: PaymentStatus.CANCELLED,
        },
      });

      if (paymentClaim.count === 0) return false;

      // Expired payment attempts are payment failures, not customer cancellations.
      // Keep CANCELLED reserved for an explicit customer cancellation.
      const orderClaim = await tx.order.updateMany({
        where: {
          id: orderId,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
        data: {
          orderStatus: OrderStatus.FAILED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      if (orderClaim.count === 0) return false;

      for (const item of items) {
        if (!item.variantId || item.quantity <= 0) continue;

        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, stockQty: true, reservedQty: true, trackInventory: true },
        });

        if (!variant?.trackInventory) continue;

        const released = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            reservedQty: { gte: item.quantity },
          },
          data: {
            reservedQty: { decrement: item.quantity },
          },
        });

        if (released.count === 0) continue;

        const qtyAfter = variant.reservedQty - item.quantity;

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            changeType: 'ORDER_RELEASE',
            delta: item.quantity,
            qtyBefore: variant.stockQty,
            qtyAfter: variant.stockQty,
            reason: `Order ${orderId} - Pending payment expired`,
            reference: orderId,
          },
        });

        this.logger.log(
          `Released ${item.quantity} reserved unit(s) for expired order ${orderId}, variant ${item.variantId}; reservedQty ${variant.reservedQty} -> ${qtyAfter}`,
        );
      }

      return true;
    });
  }

  private getExpiryMinutes(): number {
    const value = Number(process.env.PENDING_ORDER_EXPIRY_MINUTES);
    return Number.isFinite(value) && value >= 5
      ? value
      : DEFAULT_EXPIRY_MINUTES;
  }

  private getIntervalMinutes(): number {
    const value = Number(process.env.PENDING_ORDER_CLEANUP_INTERVAL_MINUTES);
    return Number.isFinite(value) && value >= 1
      ? value
      : DEFAULT_INTERVAL_MINUTES;
  }
}
