import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { StripeProvider } from './providers/stripe.provider';
import { RazorpayProvider } from './providers/razorpay.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { CryptoProvider } from './providers/crypto.provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProvider,
    private readonly razorpayProvider: RazorpayProvider,
    private readonly paypalProvider: PayPalProvider,
    private readonly cryptoProvider: CryptoProvider,
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

  async createPayment(data: {
    orderId: string;
    amount: number;
    currency: string;
    provider: string;
    paymentMethod?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    payment: Payment;
    provider: string;
    providerOrderId?: string;
    publicKey?: string;
    approveUrl?: string;
    crypto?: {
      network: string;
      asset: string;
      address: string;
      amount: number;
      currency: string;
      instructions: string;
      qrPayload: string;
    };
  }> {
    const provider = data.provider.toLowerCase().trim();

    if (!['razorpay', 'paypal', 'crypto'].includes(provider)) {
      throw new BadRequestException(
        `Payment provider ${provider} is not supported`,
      );
    }

    if (provider === 'crypto' && data.currency.toUpperCase() !== 'USD') {
      throw new BadRequestException(
        'Crypto payments are currently available only for USD orders.',
      );
    }

    if (provider === 'razorpay') {
      const result = await this.razorpayProvider.createOrder(
        data.orderId,
        data.amount,
        data.currency,
        data.metadata?.orderNumber,
      );

      const payment = await this.prisma.payment.create({
        data: {
          orderId: data.orderId,
          provider: 'razorpay',
          providerPaymentId: result.orderId,
          amount: data.amount,
          currency: data.currency,
          status: PaymentStatus.PENDING,
          paymentMethod: data.paymentMethod,
          metadata: {
            ...data.metadata,
            razorpayOrderId: result.orderId,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        payment,
        provider: 'razorpay',
        providerOrderId: result.orderId,
        publicKey: this.razorpayProvider.getKeyId(),
      };
    }

    if (provider === 'paypal') {
      const result = await this.paypalProvider.createOrder(
        data.orderId,
        data.amount,
        data.currency,
      );

      const payment = await this.prisma.payment.create({
        data: {
          orderId: data.orderId,
          provider: 'paypal',
          providerPaymentId: result.orderId,
          amount: data.amount,
          currency: data.currency,
          status: PaymentStatus.PENDING,
          paymentMethod: data.paymentMethod,
          metadata: {
            ...data.metadata,
            paypalOrderId: result.orderId,
            paypalStatus: result.status,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        payment,
        provider: 'paypal',
        providerOrderId: result.orderId,
        publicKey: this.paypalProvider.getClientId(),
        approveUrl: result.approveUrl,
      };
    }

    const method = (data.paymentMethod || '').split(':');
    const asset = (method[1] || '').toUpperCase();
    const network = (method[2] || '').toLowerCase();

    if (!asset || !network) {
      throw new BadRequestException(
        'Crypto payment requires paymentMethod format crypto:USDT:ethereum, crypto:USDC:solana, etc.',
      );
    }

    const crypto = this.cryptoProvider.createPayment(
      data.amount,
      network,
      asset,
    );

    const payment = await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        provider: 'crypto',
        providerPaymentId: null,
        amount: data.amount,
        currency: data.currency,
        status: PaymentStatus.PENDING,
        paymentMethod: data.paymentMethod,
        metadata: {
          ...data.metadata,
          network: crypto.network,
          asset: crypto.asset,
          receivingAddress: crypto.address,
          expectedAmount: crypto.amount,
          settlementCurrency: crypto.currency,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      payment,
      provider: 'crypto',
      crypto,
    };
  }

  async capturePayPalOrder(paypalOrderId: string): Promise<Record<string, unknown>> {
    return this.paypalProvider.captureOrder(paypalOrderId);
  }

  verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    return this.razorpayProvider.verifyPayment(orderId, paymentId, signature);
  }

  async fetchRazorpayPayment(paymentId: string): Promise<{
    id: string;
    orderId?: string;
    amount: number;
    currency: string;
    status: string;
  }> {
    return this.razorpayProvider.fetchPayment(paymentId);
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

  async cancelPendingPayment(paymentId: string): Promise<boolean> {
    const result = await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] },
      },
      data: { status: PaymentStatus.CANCELLED },
    });

    return result.count > 0;
  }

  async refund(paymentId: string, amount: number): Promise<Payment> {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException(`Payment ${paymentId} not found.`);
    }

    if (![PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED].includes(payment.status)) {
      throw new BadRequestException(
        'Only paid payments can be refunded.',
      );
    }

    const originalAmount = Number(payment.amount);
    const alreadyRefunded = Number(payment.refundedAmount);
    const remainingAmount = originalAmount - alreadyRefunded;

    if (amount > remainingAmount + 0.01) {
      throw new BadRequestException(
        `Refund amount exceeds the remaining refundable amount of ${Math.max(remainingAmount, 0).toFixed(2)}.`,
      );
    }

    const provider = String(payment.provider || '').toLowerCase();
    let refundResult: {
      refundId: string;
      amount: number;
      status: string;
    };

    if (provider === 'razorpay') {
      if (!payment.providerPaymentId) {
        throw new BadRequestException('Razorpay payment reference is missing.');
      }

      const result = await this.razorpayProvider.refund(
        payment.providerPaymentId,
        amount,
      );

      const status = String(result.status || '').toLowerCase();
      if (status !== 'processed') {
        throw new BadRequestException(
          `Razorpay refund is not completed: ${status || 'UNKNOWN'}`,
        );
      }

      refundResult = {
        refundId: String(result.refundId),
        amount: Number(result.amount),
        status,
      };
    } else if (provider === 'paypal') {
      if (!payment.providerPaymentId) {
        throw new BadRequestException('PayPal order reference is missing.');
      }

      const result = await this.paypalProvider.refundOrder(
        payment.providerPaymentId,
        amount,
        payment.currency,
        `wolhomes-${payment.id}-${(alreadyRefunded + amount).toFixed(2)}`,
      );

      refundResult = {
        refundId: result.refundId,
        amount: result.amount,
        status: result.status.toLowerCase(),
      };
    } else if (provider === 'stripe') {
      if (!payment.providerPaymentId) {
        throw new BadRequestException('Stripe payment reference is missing.');
      }

      const result = await this.stripeProvider.refund(
        payment.providerPaymentId,
        amount,
      );

      if (result.status.toLowerCase() !== 'succeeded') {
        throw new BadRequestException(
          `Stripe refund is not completed: ${result.status || 'UNKNOWN'}`,
        );
      }

      refundResult = {
        refundId: result.refundId,
        amount: result.amount,
        status: result.status.toLowerCase(),
      };
    } else {
      throw new BadRequestException(
        `Gateway refund is not supported for payment provider: ${provider || 'unknown'}. Use the explicit manual refund flow for non-gateway payments.`,
      );
    }

    if (!Number.isFinite(refundResult.amount) || Math.abs(refundResult.amount - amount) > 0.01) {
      throw new BadRequestException('Gateway refund amount does not match the requested refund.');
    }

    const newRefundedAmount = alreadyRefunded + amount;
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

    return this.prisma.payment.update({
      where: { id: paymentId },
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
              source: 'GATEWAY',
              provider,
              refundId: refundResult.refundId,
              amount,
              currency: payment.currency,
              status: refundResult.status,
              createdAt: new Date().toISOString(),
            },
          ],
        } as Prisma.InputJsonValue,
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
