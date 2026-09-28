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
    paymentId?: string;
    cryptoTransactionHash?: string;
    cryptoEvent?: {
      eventId: string;
      payload: Record<string, unknown>;
    };
  }): Promise<boolean> {
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

    const payment = data.paymentId
      ? order.payments.find((p) => p.id === data.paymentId)
      : order.payments.find((p) => {
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

    const isCrypto = payment.provider === 'crypto';
    const cryptoTransactionHash = data.cryptoTransactionHash?.trim().toLowerCase();

    if (isCrypto && !cryptoTransactionHash) {
      throw new BadRequestException('Crypto transaction reference is required');
    }

    if (
      !isCrypto &&
      Math.abs(Number(payment.amount) - data.amount) > 0.01
    ) {
      throw new BadRequestException('Payment amount does not match the order');
    }

    if (payment.currency.toUpperCase() !== data.currency.toUpperCase()) {
      throw new BadRequestException('Payment currency does not match the order');
    }

    let processed = false;

    try {
      await this.prisma.$transaction(async (tx) => {
        const paidUpdate = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
            ...(isCrypto
              ? {
                  OR: [
                    { cryptoTransactionHash: null },
                    { cryptoTransactionHash },
                  ],
                }
              : {}),
          },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            ...(isCrypto
              ? {
                  cryptoTransactionHash,
                  providerPaymentId: data.paymentIntentId,
                }
              : {}),
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
              variantId: item.variantId,
              changeType: 'ORDER_DEDUCT',
              delta: -item.quantity,
              qtyBefore: variant.stockQty,
              qtyAfter: variant.stockQty - item.quantity,
              reason: `Order ${order.orderNumber} - Payment confirmed`,
              reference: order.id,
            },
          });
        }

        if (isCrypto && data.cryptoEvent) {
          await tx.webhookEvent.upsert({
            where: { eventId: data.cryptoEvent.eventId },
            create: {
              provider: 'crypto',
              eventType: 'payment.verified',
              eventId: data.cryptoEvent.eventId,
              payload: data.cryptoEvent.payload,
              status: 'completed',
              processedAt: new Date(),
            },
            update: {
              provider: 'crypto',
              eventType: 'payment.verified',
              payload: data.cryptoEvent.payload,
              status: 'completed',
              processedAt: new Date(),
            },
          });
        }
      });
    } catch (error) {
      if (
        isCrypto &&
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new BadRequestException(
          'This crypto transaction has already been assigned to another payment',
        );
      }
      throw error;
    }

    if (!processed) {
      this.logger.log(
        `Payment ${payment.id} was already processed; skipping duplicate success callback`,
      );
      return false;
    }

    this.logger.log(
      `Payment success processed for order ${order.orderNumber}: inventory decremented`,
    );
    return true;
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
      include: { payments: true, items: true },
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

    if (payment.currency.toUpperCase() !== data.currency.toUpperCase()) {
      throw new BadRequestException('Refund currency does not match the payment');
    }

    const currentRefundedAmount = Number(payment.refundedAmount);
    const reportedRefundedAmount = Number(data.refundAmount);

    if (!Number.isFinite(reportedRefundedAmount) || reportedRefundedAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }

    // Provider refund webhooks report the cumulative refunded amount.
    // Ignore duplicate/stale callbacks so inventory is never restocked twice.
    if (reportedRefundedAmount <= currentRefundedAmount + 0.01) {
      this.logger.log(
        `Refund webhook already reflected for payment ${payment.id}; skipping duplicate callback`,
      );
      return;
    }

    const originalAmount = Number(payment.amount);
    if (reportedRefundedAmount > originalAmount + 0.01) {
      throw new BadRequestException('Refund amount exceeds the payment amount');
    }

    const isFullRefund = reportedRefundedAmount >= originalAmount - 0.01;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: isFullRefund ? originalAmount : reportedRefundedAmount,
          status: isFullRefund
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED,
          refundedAt: new Date(),
        },
      });

      if (!isFullRefund) return;

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          orderStatus: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });

      for (const item of payment.order.items) {
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
    });

    this.logger.log(
      `Refund reconciled for payment ${payment.id}: ${reportedRefundedAmount} ${data.currency}`,
    );
  }}
