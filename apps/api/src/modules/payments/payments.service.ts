import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { StripeProvider } from './providers/stripe.provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProvider,
    private readonly config: ConfigService,
  ) {}

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

  /**
   * Create payment intent with provider (Stripe)
   * Returns client secret for frontend payment confirmation
   */
  async createPaymentIntent(data: {
    orderId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }): Promise<{ payment: Payment; clientSecret: string }> {
    const provider = this.config.get<string>('commerce.payment.provider', 'none');
    
    if (provider !== 'stripe') {
      throw new BadRequestException(`Payment provider ${provider} not supported for payment intent`);
    }

    // Create payment intent with Stripe
    const intent = await this.stripeProvider.createPaymentIntent(
      data.orderId,
      data.amount,
      data.currency,
      data.metadata,
    );

    // Create payment record in database
    const payment = await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        provider: 'stripe',
        providerPaymentId: intent.paymentIntentId,
        amount: data.amount,
        currency: data.currency,
        status: PaymentStatus.PENDING,
        metadata: {
          ...data.metadata,
          clientSecret: intent.clientSecret,
        } as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Payment intent created for order ${data.orderId}: ${intent.paymentIntentId}`);

    return {
      payment,
      clientSecret: intent.clientSecret,
    };
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
    if (!payment) throw new BadRequestException(`Payment ${paymentId} not found.`);

    // Process refund with provider if it's Stripe
    if (payment.provider === 'stripe' && payment.providerPaymentId) {
      try {
        await this.stripeProvider.refund(
          payment.providerPaymentId,
          amount,
          'requested_by_customer',
        );
        this.logger.log(`Stripe refund processed for payment ${paymentId}`);
      } catch (error) {
        this.logger.error(`Stripe refund failed: ${error.message}`);
        throw error;
      }
    }

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
