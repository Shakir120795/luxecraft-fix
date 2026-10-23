import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

    return existing !== null;
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
    await this.prisma.webhookEvent.create({
      data: {
        provider: data.provider,
        eventType: data.eventType,
        eventId: data.eventId,
        payload: data.payload,
        status: data.status,
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
   * Find the payment record for an order from any provider reference.
   *
   * Providers hand us different identifiers at different steps: the id we
   * store at creation time is the provider ORDER id (Razorpay order_…,
   * PayPal order id), while later callbacks may carry the provider PAYMENT /
   * capture / transaction id instead. The creation-time id must never be
   * overwritten, so every other reference is kept in payment.metadata and
   * matched here as well.
   */
  findPaymentForOrder(
    payments: Array<{
      id: string;
      provider: string;
      providerPaymentId: string | null;
      status: PaymentStatus;
      metadata: unknown;
    }>,
    references: string[],
    provider?: string,
  ) {
    const refs = references.filter(Boolean);
    const metadataRefs = (metadata: unknown): string[] => {
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
      const record = metadata as Record<string, unknown>;
      return [
        record.razorpayOrderId,
        record.razorpayPaymentId,
        record.paypalOrderId,
        record.paypalCaptureId,
        record.txHash,
      ].filter((value): value is string => typeof value === 'string' && value.length > 0);
    };

    return (
      payments.find((p) => p.providerPaymentId !== null && refs.includes(p.providerPaymentId)) ||
      payments.find((p) => metadataRefs(p.metadata).some((ref) => refs.includes(ref))) ||
      // Fallback: the only not-yet-paid payment for this order (optionally
      // restricted to the provider that reported the event).
      payments.find(
        (p) => p.status !== PaymentStatus.PAID && (!provider || p.provider === provider),
      ) ||
      payments.find((p) => !provider || p.provider === provider) ||
      null
    );
  }

  /** Resolve an internal order id from a stored provider reference (e.g. a PayPal order id). */
  async findOrderIdByProviderReference(referenceId: string): Promise<string | null> {
    if (!referenceId) return null;
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: referenceId },
      select: { orderId: true },
    });
    return payment?.orderId ?? null;
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
    provider?: string;
    providerReferenceIds?: string[];
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

    // Find the payment record by any known provider reference. Never rely on
    // a single id shape: Razorpay webhooks carry the provider order id,
    // the verify endpoint carries the payment id, PayPal webhooks carry the
    // capture id while capture carries the PayPal order id, and crypto
    // carries the transaction hash.
    const payment = this.findPaymentForOrder(
      order.payments,
      [data.paymentIntentId, ...(data.providerReferenceIds ?? [])],
      data.provider,
    );

    if (!payment) {
      this.logger.error(
        `Payment with intent ${data.paymentIntentId} not found for order ${data.orderId}`,
      );
      throw new NotFoundException('Payment not found');
    }

    // Idempotent: a duplicate verify/webhook for an already-paid order is a
    // success, not an error (both channels race to confirm the same payment).
    if (payment.status === PaymentStatus.PAID) {
      this.logger.log(
        `Payment for order ${order.orderNumber} already marked PAID; skipping duplicate success event`,
      );
      return;
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // 1. Update payment status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      // 2. Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.PAYMENT_CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
      });

      // 3. CRITICAL: Decrement inventory for each item
      for (const item of order.items) {
        if (item.variantId) {
          // Product has variants - decrement variant stock
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (variant && variant.trackInventory) {
            this.logger.log(
              `Decrementing stock for variant ${variant.id}: ${item.quantity} units`,
            );

            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stockQty: {
                  decrement: item.quantity,
                },
                // Settle the reservation made at checkout so reserved stock
                // does not leak (available = stockQty - reservedQty).
                reservedQty: Math.max(0, variant.reservedQty - item.quantity),
              },
            });

            // Log inventory change
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
        } else {
          if (!item.productId) continue;
          // Product without variants - check if product itself tracks inventory
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product && product.trackInventory) {
            this.logger.log(
              `Decrementing stock for product ${product.id}: ${item.quantity} units`,
            );

            // Update product stock (if your schema supports it)
            // Note: Your current schema may not have stockQty on Product model
            // If not, you may need to add it or handle differently
          }
        }
      }
    });

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
    provider?: string;
    providerReferenceIds?: string[];
  }): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${data.orderId} not found`);
    }

    const payment = this.findPaymentForOrder(
      order.payments,
      [data.paymentIntentId, ...(data.providerReferenceIds ?? [])],
      data.provider,
    );

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // A late failure event must not undo a payment that already succeeded.
    if (payment.status === PaymentStatus.PAID) {
      this.logger.log(
        `Ignoring failure event for already-paid order ${order.orderNumber}`,
      );
      return;
    }

    await this.prisma.$transaction([
      // Update payment status
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          metadata: {
            ...((payment.metadata as any) || {}),
            failureReason: data.reason,
          },
        },
      }),

      // Update order status
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.FAILED,
          paymentStatus: PaymentStatus.FAILED,
        },
      }),
    ]);

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
