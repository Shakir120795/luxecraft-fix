import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CreatePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface RefundResult {
  refundId: string;
  amount: number;
  status: string;
}

/**
 * Stripe Payment Provider
 * Handles payment intent creation, confirmation, refunds, and webhook verification
 */
@Injectable()
export class StripeProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('stripe.secretKey');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured - payment processing will fail');
    }
    
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });

    this.webhookSecret = this.config.get<string>('stripe.webhookSecret') || '';
  }

  /**
   * Create a payment intent for checkout
   * @param orderId - Order ID for metadata
   * @param amount - Amount in smallest currency unit (e.g., cents for USD)
   * @param currency - Currency code (usd, inr, eur, etc.)
   * @param metadata - Additional metadata to attach
   */
  async createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ): Promise<CreatePaymentIntentResult> {
    try {
      // Convert amount to smallest currency unit (cents)
      const amountInCents = Math.round(amount * 100);

      this.logger.log(
        `Creating Stripe payment intent: ${amountInCents} ${currency} for order ${orderId}`,
      );

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId,
          ...metadata,
        },
        description: `Order ${metadata?.orderNumber || orderId}`,
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back to major currency unit
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Retrieve payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw new BadRequestException('Failed to retrieve payment intent');
    }
  }

  /**
   * Process full or partial refund
   * @param paymentIntentId - Stripe payment intent ID
   * @param amount - Amount to refund (in major currency unit). Omit for full refund
   * @param reason - Reason for refund
   */
  async refund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  ): Promise<RefundResult> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        ...(amount && { amount: Math.round(amount * 100) }), // Convert to cents if specified
        ...(reason && { reason }),
      };

      this.logger.log(
        `Creating refund for payment intent ${paymentIntentId}: ${amount ? amount : 'full'}`,
      );

      const refund = await this.stripe.refunds.create(refundParams);

      this.logger.log(`Refund created: ${refund.id} - ${refund.status}`);

      return {
        refundId: refund.id,
        amount: refund.amount / 100, // Convert back to major currency unit
        status: refund.status,
      };
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Verify Stripe webhook signature
   * CRITICAL: Must be called before processing any webhook event
   * @param rawBody - Raw request body (string or Buffer)
   * @param signature - Stripe signature header (stripe-signature)
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );

      this.logger.log(`Webhook signature verified: ${event.type}`);
      return event;
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Cancel a payment intent (if still cancelable)
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Canceling payment intent: ${paymentIntentId}`);
      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to cancel payment intent: ${error.message}`);
      throw new BadRequestException('Failed to cancel payment intent');
    }
  }

  /**
   * Get publishable key for frontend (safe to expose)
   */
  getPublishableKey(): string {
    return this.config.get<string>('stripe.publishableKey') || '';
  }

  /**
   * Check if Stripe is properly configured
   */
  isConfigured(): boolean {
    const secretKey = this.config.get<string>('stripe.secretKey');
    const publishableKey = this.config.get<string>('stripe.publishableKey');
    return Boolean(secretKey && publishableKey);
  }
}
