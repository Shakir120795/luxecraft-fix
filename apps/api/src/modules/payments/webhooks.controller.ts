import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { StripeProvider } from './providers/stripe.provider';
import { WebhookService } from './webhook.service';
import Stripe from 'stripe';

/**
 * Webhook Controller
 * Handles payment provider webhooks with signature verification and idempotency
 * 
 * CRITICAL SECURITY:
 * - All webhook endpoints MUST verify signature before processing
 * - Raw body is required for signature verification
 * - Idempotency prevents duplicate processing
 */
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly stripeProvider: StripeProvider,
    private readonly webhookService: WebhookService,
  ) {}

  /**
   * Stripe webhook endpoint
   * Endpoint: POST /webhooks/stripe
   * 
   * SETUP INSTRUCTIONS:
   * 1. Go to https://dashboard.stripe.com/test/webhooks
   * 2. Create endpoint: https://yourdomain.com/webhooks/stripe
   * 3. Select events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
   * 4. Copy webhook secret to STRIPE_WEBHOOK_SECRET env variable
   * 
   * PRODUCTION: Use live mode webhook secret in production
   */
  @Public()
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing signature header');
    }

    if (!request.rawBody) {
      this.logger.error('Missing raw body for signature verification');
      throw new BadRequestException('Raw body required for webhook verification');
    }

    let event: Stripe.Event;

    try {
      // CRITICAL: Verify webhook signature before processing
      event = this.stripeProvider.verifyWebhookSignature(request.rawBody, signature);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid signature');
    }

    // Check idempotency - have we already processed this event?
    const alreadyProcessed = await this.webhookService.isEventProcessed(
      'stripe',
      event.id,
    );

    if (alreadyProcessed) {
      this.logger.log(`Duplicate webhook event ${event.id} - already processed`);
      return { received: true };
    }

    // Record webhook event immediately (for idempotency)
    await this.webhookService.recordWebhookEvent({
      provider: 'stripe',
      eventType: event.type,
      eventId: event.id,
      payload: event,
      status: 'processing',
    });

    this.logger.log(`Processing Stripe webhook: ${event.type} (${event.id})`);

    try {
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark webhook as processed successfully
      await this.webhookService.markEventProcessed('stripe', event.id);

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook ${event.id}: ${error.message}`, error.stack);
      
      // Mark webhook as failed
      await this.webhookService.markEventFailed('stripe', event.id, error.message);
      
      throw error;
    }
  }

  /**
   * Handle successful payment
   * Updates payment status, order status, and decrements inventory
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      this.logger.warn(`Payment intent ${paymentIntent.id} has no orderId in metadata`);
      return;
    }

    this.logger.log(`Payment succeeded for order ${orderId}: ${paymentIntent.id}`);

    await this.webhookService.handlePaymentSuccess({
      orderId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
    });
  }

  /**
   * Handle failed payment
   * Updates payment status and order status
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      this.logger.warn(`Payment intent ${paymentIntent.id} has no orderId in metadata`);
      return;
    }

    this.logger.log(`Payment failed for order ${orderId}: ${paymentIntent.id}`);

    await this.webhookService.handlePaymentFailed({
      orderId,
      paymentIntentId: paymentIntent.id,
      reason: paymentIntent.last_payment_error?.message || 'Payment failed',
    });
  }

  /**
   * Handle refund
   * Updates payment refunded amount
   */
  private async handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      this.logger.warn(`Charge ${charge.id} has no payment_intent`);
      return;
    }

    this.logger.log(`Refund processed for payment intent ${paymentIntentId}`);

    await this.webhookService.handleRefund({
      paymentIntentId,
      refundAmount: charge.amount_refunded / 100, // Convert from cents
      currency: charge.currency,
    });
  }
}
