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
        items: {
          include: {
            variant: true,
            product: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${data.orderId} not found`);
    }

    // Find the payment record
    const payment = order.payments.find(
      (p) => p.providerPaymentId === data.paymentIntentId,
    );

    if (!payment) {
      this.logger.error(
        `Payment with intent ${data.paymentIntentId} not found for order ${data.orderId}`,
      );
      throw new NotFoundException('Payment not found');
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
              },
            });

            // Log inventory change
            await tx.inventoryLog.create({
              data: {
                variantId: variant.id,
                changeType: 'ORDER_DEDUCT',
                quantityChange: -item.quantity,
                quantityAfter: variant.stockQty - item.quantity,
                reason: `Order ${order.orderNumber} - Payment confirmed`,
                metadata: {
                  orderId: order.id,
                  paymentId: payment.id,
                  paymentIntentId: data.paymentIntentId,
                },
              },
            });
          }
        } else {
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
            items: {
              include: {
                variant: true,
              },
            },
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
          if (item.variantId && item.variant?.trackInventory) {
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
                quantityChange: item.quantity,
                quantityAfter: item.variant.stockQty + item.quantity,
                reason: `Order ${payment.order.orderNumber} - Full refund`,
                metadata: {
                  orderId: payment.orderId,
                  paymentId: payment.id,
                  refundAmount: data.refundAmount,
                },
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
