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
    const where: Prisma.OrderWhereInput = {
      paymentStatus: (params.paymentStatus as any) || PaymentStatus.PAID,
      ...(params.orderStatus && { orderStatus: params.orderStatus as any }),
      ...(params.search && {
        OR: [
          { orderNumber: { contains: params.search, mode: 'insensitive' } },
          { guestEmail: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } }, payments: true, items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: true, items: true, payments: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found.`);
    return order;
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
