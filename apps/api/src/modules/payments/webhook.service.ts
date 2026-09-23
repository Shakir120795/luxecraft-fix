import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';

/**
 * Webhook Service
 * Handles webhook event processing with idempotency and business logic
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  /**
   * Check if webhook event has already been processed (idempotency)
   */
  async isEventProcessed(provider: string, eventId: string): Promise<boolean> {
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    return existing?.status === 'completed' || Boolean(existing?.processedAt);
  }

  /**
   * Record webhook event for idempotency tracking
   */
  async recordWebhookEvent(data: {
    provider: string;
    eventType: string;
    eventId: string;
    payload: any;
    status: string;
  }): Promise<void> {
    await this.prisma.webhookEvent.upsert({
      where: { eventId: data.eventId },
      create: {
        provider: data.provider,
        eventType: data.eventType,
        eventId: data.eventId,
        payload: data.payload,
        status: data.status,
      },
      update: {
        provider: data.provider,
        eventType: data.eventType,
        payload: data.payload,
        status: data.status,
        processedAt: null,
      },
    });
  }

  /**
   * Mark webhook event as successfully processed
   */
  async markEventProcessed(provider: string, eventId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: 'completed',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark webhook event as failed
   */
  async markEventFailed(provider: string, eventId: string, error: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: 'failed',
        payload: {
          error,
        },
      },
    });
  }

  /**
   * Handle successful payment
   * CRITICAL: This is where inventory is decremented!
   */
  async handlePaymentSuccess(data: {
    orderId: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
  }): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${data.orderId} not found`);
    }

    // Find the payment record
    const payment = order.payments.find((p) => {
      if (p.providerPaymentId === data.paymentIntentId) return true;

      if (p.provider === 'paypal') {
        const metadata =
          p.metadata &&
          typeof p.metadata === 'object' &&
          !Array.isArray(p.metadata)
            ? (p.metadata as Record<string, unknown>)
            : {};

        return String(metadata.paypalOrderId || '') === data.paymentIntentId;
      }

      return false;
    });

    if (!payment) {
      this.logger.error(
        `Payment with provider reference ${data.paymentIntentId} not found for order ${data.orderId}`,
      );
      throw new NotFoundException('Payment not found');
    }

    if (
      payment.provider !== 'crypto' &&
      Math.abs(Number(payment.amount) - data.amount) > 0.01
    ) {
      throw new BadRequestException('Payment amount does not match the order');
    }

    if (
      payment.currency.toUpperCase() !== data.currency.toUpperCase()
    ) {
      throw new BadRequestException('Payment currency does not match the order');
    }

    // Use a transaction and a conditional payment update so callbacks/webhooks
    // cannot mark the same payment paid (or deduct stock) more than once.
    let processed = false;
    await this.prisma.$transaction(async (tx) => {
      const paidUpdate = await tx.payment.updateMany({
        where: { id: payment.id, status: { not: PaymentStatus.PAID } },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      if (paidUpdate.count === 0) return;
      processed = true;

      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.PAYMENT_CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
      });

      for (const item of order.items) {
        if (!item.variantId) continue;

        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || !variant.trackInventory) continue;

        this.logger.log(`Decrementing stock for variant ${variant.id}: ${item.quantity} units`);

        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stockQty: { decrement: item.quantity },
            reservedQty: { decrement: item.quantity },
          },
        });

        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            changeType: 'ORDER_DEDUCT',
            delta: -item.quantity,
            qtyBefore: variant.stockQty,
            qtyAfter: variant.stockQty - item.quantity,
            reason: `Order ${order.orderNumber} - Payment confirmed`,
            reference: order.id,
          },
        });
      }
    });

    if (!processed) {
      this.logger.log(`Payment ${payment.id} was already processed; skipping duplicate success callback`);
      return;
    }
    this.logger.log(
      `Payment success processed for order ${order.orderNumber}: inventory decremented`,
    );
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(data: {
    orderId: string;
    paymentIntentId: string;
    reason: string;
  }): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${data.orderId} not found`);
    }

    const payment = order.payments.find(
      (p) => p.providerPaymentId === data.paymentIntentId,
    );

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    let processed = false;
    await this.prisma.$transaction(async (tx) => {
      const failedUpdate = await tx.payment.updateMany({
        where: { id: payment.id, status: { not: PaymentStatus.PAID } },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          metadata: {
            ...((payment.metadata as any) || {}),
            failureReason: data.reason,
          },
        },
      });

      if (failedUpdate.count === 0) return;
      processed = true;

      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.FAILED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      for (const item of order.items) {
        if (!item.variantId) continue;

        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant?.trackInventory) continue;

        const released = await tx.productVariant.updateMany({
          where: { id: item.variantId, reservedQty: { gte: item.quantity } },
          data: { reservedQty: { decrement: item.quantity } },
        });

        if (released.count > 0) {
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              changeType: 'ORDER_RELEASE',
              delta: item.quantity,
              qtyBefore: variant.stockQty,
              qtyAfter: variant.stockQty,
              reason: `Order ${order.orderNumber} - Payment failed`,
              reference: order.id,
            },
          });
        }
      }
    });

    if (!processed) {
      this.logger.log(`Payment ${payment.id} was already paid; ignoring failed callback`);
      return;
    }

    this.logger.log(`Payment failed for order ${order.orderNumber}: ${data.reason}`);
  }

  /**
   * Handle refund
   */
  async handleRefund(data: {
    paymentIntentId: string;
    refundAmount: number;
    currency: string;
  }): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: data.paymentIntentId },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with intent ${data.paymentIntentId} not found`);
    }

    const isFullRefund = data.refundAmount >= Number(payment.amount);

    await this.prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: data.refundAmount,
          status: isFullRefund
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED,
          refundedAt: new Date(),
        },
      });

      // If full refund, update order status and restock inventory
      if (isFullRefund) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            orderStatus: OrderStatus.REFUNDED,
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });

        // Restock inventory for each item
        for (const item of payment.order.items) {
          if (!item.variantId) continue;
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant?.trackInventory) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQty: {
                  increment: item.quantity,
                },
              },
            });

            // Log inventory change
            await tx.inventoryLog.create({
              data: {
                variantId: item.variantId,
                changeType: 'RETURN_RESTOCK',
                delta: item.quantity,
                qtyBefore: variant.stockQty,
                qtyAfter: variant.stockQty + item.quantity,
                reason: `Order ${payment.order.orderNumber} - Full refund`,
                reference: payment.orderId,
              },
            });

            this.logger.log(
              `Restocked variant ${item.variantId}: ${item.quantity} units (refund)`,
            );
          }
        }
      }
    });

    this.logger.log(
      `Refund processed for payment ${payment.id}: ${data.refundAmount} ${data.currency}`,
    );
  }
}
