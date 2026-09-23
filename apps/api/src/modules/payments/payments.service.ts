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

  async refund(paymentId: string, amount: number): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException(`Payment ${paymentId} not found.`);
    }

    if (payment.provider === 'razorpay' && payment.providerPaymentId) {
      await this.razorpayProvider.refund(payment.providerPaymentId, amount);
    } else if (payment.provider === 'paypal') {
      throw new BadRequestException(
        'PayPal refund flow must be processed through PayPal capture/refund handling.',
      );
    }

    const newRefundedAmount = Number(payment.refundedAmount) + amount;
    const isFullRefund = newRefundedAmount >= Number(payment.amount);

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        refundedAmount: newRefundedAmount,
        status: isFullRefund
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED,
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
