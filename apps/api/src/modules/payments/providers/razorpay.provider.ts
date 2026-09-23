import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
}

@Injectable()
export class RazorpayProvider {
  private readonly logger = new Logger(RazorpayProvider.name);
  private readonly razorpay: Razorpay | null;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.keyId = this.config.get<string>('commerce.payment.razorpayKeyId') || '';
    this.keySecret = this.config.get<string>('commerce.payment.razorpayKeySecret') || '';
    this.webhookSecret = this.config.get<string>('commerce.payment.razorpayWebhookSecret') || '';

    this.razorpay =
      this.keyId && this.keySecret
        ? new Razorpay({
            key_id: this.keyId,
            key_secret: this.keySecret,
          })
        : null;

    if (!this.razorpay) {
      this.logger.warn('Razorpay credentials not configured');
    }
  }

  private getClient(): Razorpay {
    if (!this.razorpay) {
      throw new BadRequestException('Razorpay is not configured');
    }
    return this.razorpay;
  }

  async createOrder(
    orderId: string,
    amount: number,
    currency: string,
    receipt?: string,
  ): Promise<RazorpayOrderResult> {
    try {
      const amountInSubunits = Math.round(amount * 100);

      const order = await this.getClient().orders.create({
        amount: amountInSubunits,
        currency: currency.toUpperCase(),
        receipt: (receipt || orderId).slice(0, 40),
        notes: { orderId },
      });

      this.logger.log(`Razorpay order created: ${order.id} for ${orderId}`);

      return {
        orderId: order.id,
        amount: Number(order.amount) / 100,
        currency: order.currency,
      };
    } catch (error) {
      this.logger.error(`Failed to create Razorpay order: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create Razorpay order');
    }
  }

  verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    if (!this.keySecret) {
      throw new BadRequestException('Razorpay secret is not configured');
    }

    try {
      return validatePaymentVerification(
        { order_id: orderId, payment_id: paymentId },
        signature,
        this.keySecret,
      );
    } catch (error) {
      this.logger.error(`Razorpay payment verification failed: ${error.message}`);
      throw new BadRequestException('Invalid Razorpay payment signature');
    }
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) {
      throw new BadRequestException('Razorpay webhook secret is not configured');
    }

    try {
      return Razorpay.validateWebhookSignature(rawBody, signature, this.webhookSecret);
    } catch (error) {
      this.logger.error(`Razorpay webhook verification failed: ${error.message}`);
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }
  }

  async fetchPayment(paymentId: string): Promise<{
    id: string;
    orderId?: string;
    amount: number;
    currency: string;
    status: string;
  }> {
    try {
      const payment = await this.getClient().payments.fetch(paymentId);
      return {
        id: String(payment.id),
        orderId: payment.order_id ? String(payment.order_id) : undefined,
        amount: Number(payment.amount || 0) / 100,
        currency: String(payment.currency || '').toUpperCase(),
        status: String(payment.status || '').toLowerCase(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch Razorpay payment: ' + error.message, error.stack);
      throw new BadRequestException('Unable to verify Razorpay payment status');
    }
  }

  async refund(paymentId: string, amount?: number) {
    try {
      const result = await this.getClient().payments.refund(paymentId, {
        ...(amount ? { amount: Math.round(amount * 100) } : {}),
      });

      return {
        refundId: result.id,
        amount: Number(result.amount || 0) / 100,
        status: result.status,
      };
    } catch (error) {
      this.logger.error(`Razorpay refund failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process Razorpay refund');
    }
  }

  getKeyId(): string {
    return this.keyId;
  }

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }
}
