import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    orderId: string;
    provider: string;
    amount: number;
    currency: string;
    paymentMethod?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        provider: data.provider,
        amount: data.amount,
        currency: data.currency,
        status: PaymentStatus.PENDING,
        paymentMethod: data.paymentMethod,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async updateStatus(
    paymentId: string,
    status: PaymentStatus,
    providerPaymentId?: string,
  ): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        ...(providerPaymentId && { providerPaymentId }),
        ...(status === PaymentStatus.PAID && { paidAt: new Date() }),
        ...(status === PaymentStatus.FAILED && { failedAt: new Date() }),
      },
    });
  }

  async refund(paymentId: string, amount: number): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error(`Payment ${paymentId} not found.`);

    const newRefundedAmount = Number(payment.refundedAmount) + amount;
    const isFullRefund = newRefundedAmount >= Number(payment.amount);

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        refundedAmount: newRefundedAmount,
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAt: new Date(),
      },
    });
  }

  async findByOrder(orderId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
