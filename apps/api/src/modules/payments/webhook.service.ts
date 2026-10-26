import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { redeemCouponCustomerUsage, releaseCouponCustomerUsage } from '../admin-coupons/coupon-customer-usage';

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
        customQuote: {
          include: { customRequest: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${data.orderId} not found`);
    }

    const payment = data.paymentId
      ? order.payments.find((p) => p.id === data.paymentId)
      : order.payments.find((p) => {
          if (p.providerPaymentId === data.paymentIntentId) return true;

          const metadata =
            p.metadata &&
            typeof p.metadata === 'object' &&
            !Array.isArray(p.metadata)
              ? (p.metadata as Record<string, unknown>)
              : {};

          if (p.provider === 'paypal') {
            return String(metadata.paypalOrderId || '') === data.paymentIntentId;
          }

          if (p.provider === 'razorpay') {
            return String(metadata.razorpayOrderId || '') === data.paymentIntentId;
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

        if (order.couponId) {
          // Only the transaction that changes RESERVED -> USED may commit the
          // redemption. Duplicate callbacks cannot decrement another reservation.
          const consumedCouponUse = await tx.order.updateMany({
            where: { id: order.id, couponUsageStatus: 'RESERVED' },
            data: { couponUsageStatus: 'USED' },
          });

          if (consumedCouponUse.count > 0) {
            await redeemCouponCustomerUsage(tx, order.couponId, order.userId, order.guestEmail);
            const updatedCoupon = await tx.coupon.update({
              where: { id: order.couponId },
              data: {
                reservedCount: { decrement: 1 },
                usedCount: { increment: 1 },
              },
            });

            // Once the global limit is consumed, also deactivate it in the
            // admin list and remove its homepage-label flag. Failed payment
            // reservations are released elsewhere and do not deactivate it.
            if (
              updatedCoupon.maxUsageCount != null &&
              updatedCoupon.usedCount >= updatedCoupon.maxUsageCount
            ) {
              await tx.coupon.update({
                where: { id: updatedCoupon.id },
                data: { isActive: false, showOnHome: false },
              });
            }
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            orderStatus: OrderStatus.PAYMENT_CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
          },
        });

        // For custom-design orders, crafting may only begin after the quote has
        // been accepted and payment has been verified by the gateway.
        if (order.customQuote?.customRequestId) {
          await tx.customRequest.update({
            where: { id: order.customQuote.customRequestId },
            data: { status: 'IN_PROGRESS' },
          });
        }

        for (const item of order.items) {
          if (!item.variantId) continue;

          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant || !variant.trackInventory) continue;

          this.logger.log(`Decrementing stock for variant ${variant.id}: ${item.quantity} units`);

          // Lock the current inventory row so concurrent paid orders cannot
          // deduct from the same stale stock snapshot.
          const currentVariants = await tx.$queryRaw<
            Array<{ stockQty: number; reservedQty: number }>
          >`
            SELECT "stockQty", "reservedQty"
            FROM "product_variants"
            WHERE "id" = ${variant.id}
            FOR UPDATE
          `;
          const currentVariant = currentVariants[0];
          if (!currentVariant) continue;

          // Checkout does not always create a reservation. Clamp old negative
          // reservation values and never let either stock field go below zero.
          const qtyBefore = Math.max(0, Number(currentVariant.stockQty) || 0);
          const qtyAfter = Math.max(0, qtyBefore - item.quantity);
          const reservedBefore = Math.max(0, Number(currentVariant.reservedQty) || 0);
          const reservedAfter = Math.max(0, reservedBefore - item.quantity);

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stockQty: qtyAfter,
              reservedQty: reservedAfter,
            },
          });

          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              changeType: 'ORDER_DEDUCT',
              delta: qtyAfter - qtyBefore,
              qtyBefore,
              qtyAfter,
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
              payload: data.cryptoEvent.payload as any,
              status: 'completed',
              processedAt: new Date(),
            },
            update: {
              provider: 'crypto',
              eventType: 'payment.verified',
              payload: data.cryptoEvent.payload as any,
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
        where: {
          id: payment.id,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
        },
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

      if (order.couponId) {
        const releasedCouponUse = await tx.order.updateMany({
          where: { id: order.id, couponUsageStatus: 'RESERVED' },
          data: { couponUsageStatus: 'RELEASED' },
        });

        if (releasedCouponUse.count > 0) {
          await releaseCouponCustomerUsage(tx, order.couponId, order.userId, order.guestEmail);
          await tx.coupon.updateMany({
            where: { id: order.couponId, reservedCount: { gt: 0 } },
            data: { reservedCount: { decrement: 1 } },
          });
        }
      }

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

    const reportedRefundedAmount = Number(data.refundAmount);

    if (!Number.isFinite(reportedRefundedAmount) || reportedRefundedAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }

    const originalAmount = Number(payment.amount);
    if (reportedRefundedAmount > originalAmount + 0.01) {
      throw new BadRequestException('Refund amount exceeds the payment amount');
    }

    const isFullRefund = reportedRefundedAmount >= originalAmount - 0.01;
    let processed = false;

    await this.prisma.$transaction(async (tx) => {
      // Atomic compare-and-set: only the first webhook that advances the
      // cumulative refunded amount is allowed to change the payment.
      // This prevents duplicate/concurrent refund events from restocking twice.
      const refundUpdate = await tx.payment.updateMany({
        where: {
          id: payment.id,
          refundedAmount: { lt: reportedRefundedAmount },
        },
        data: {
          refundedAmount: isFullRefund ? originalAmount : reportedRefundedAmount,
          status: isFullRefund
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED,
          refundedAt: new Date(),
        },
      });

      if (refundUpdate.count === 0) {
        this.logger.log(
          `Refund webhook already reflected for payment ${payment.id}; skipping duplicate/stale callback`,
        );
        return;
      }

      processed = true;

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

    if (!processed) return;

    this.logger.log(
      `Refund reconciled for payment ${payment.id}: ${reportedRefundedAmount} ${data.currency}`,
    );
  }}
