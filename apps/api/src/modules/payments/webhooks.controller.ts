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
import { RazorpayProvider } from './providers/razorpay.provider';
import { ConfigService } from '@nestjs/config';
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
    private readonly razorpayProvider: RazorpayProvider,
    private readonly config: ConfigService,
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
  /**
   * Razorpay webhook endpoint
   * Endpoint: POST /webhooks/razorpay
   */
  @Public()
  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Headers('x-razorpay-event-id') eventIdHeader: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing Razorpay signature header');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Raw body required for Razorpay webhook verification');
    }

    const rawBody = request.rawBody.toString('utf8');

    try {
      this.razorpayProvider.verifyWebhook(rawBody, signature);
    } catch (error) {
      this.logger.error(`Razorpay webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    let event: Record<string, any>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid Razorpay webhook payload');
    }

    const eventId = eventIdHeader || String(event.id || '');
    const eventType = String(event.event || '');

    if (!eventId) {
      throw new BadRequestException('Missing Razorpay event ID');
    }

    if (await this.webhookService.isEventProcessed('razorpay', eventId)) {
      return { received: true };
    }

    await this.webhookService.recordWebhookEvent({
      provider: 'razorpay',
      eventType,
      eventId,
      payload: event,
      status: 'processing',
    });

    try {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const razorpayOrderId = String(
        paymentEntity?.order_id || orderEntity?.id || '',
      );

      const orderId = String(
        paymentEntity?.notes?.orderId ||
        orderEntity?.notes?.orderId ||
        '',
      );

      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        if (!orderId) {
          this.logger.warn(`Razorpay event ${eventId} has no internal orderId`);
        } else {
          await this.webhookService.handlePaymentSuccess({
            orderId,
            paymentIntentId: razorpayOrderId,
            amount: Number(paymentEntity?.amount || orderEntity?.amount || 0) / 100,
            currency: String(paymentEntity?.currency || orderEntity?.currency || ''),
          });
        }
      } else if (eventType === 'payment.failed') {
        if (!orderId) {
          this.logger.warn(`Razorpay failed event ${eventId} has no internal orderId`);
        } else {
          await this.webhookService.handlePaymentFailed({
            orderId,
            paymentIntentId: razorpayOrderId,
            reason: String(
              paymentEntity?.error_description ||
              paymentEntity?.error_reason ||
              'Razorpay payment failed',
            ),
          });
        }
      }

      await this.webhookService.markEventProcessed('razorpay', eventId);
      return { received: true };
    } catch (error) {
      await this.webhookService.markEventFailed(
        'razorpay',
        eventId,
        error instanceof Error ? error.message : 'Razorpay webhook processing failed',
      );
      throw error;
    }
  }
  @Public()
  /**
   * PayPal webhook endpoint
   * Endpoint: POST /webhooks/paypal
   */
  @Public()
  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  async handlePayPalWebhook(
    @Headers('paypal-transmission-id') transmissionId: string,
    @Headers('paypal-transmission-time') transmissionTime: string,
    @Headers('paypal-cert-url') certUrl: string,
    @Headers('paypal-transmission-sig') transmissionSig: string,
    @Headers('paypal-auth-algo') authAlgo: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    if (!request.rawBody) throw new BadRequestException('Raw body required for PayPal webhook verification');
    if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo) {
      throw new BadRequestException('Missing PayPal webhook signature headers');
    }

    const rawBody = request.rawBody.toString('utf8');
    let event: Record<string, any>;

    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid PayPal webhook payload');
    }

    const webhookId = this.config.get<string>('commerce.payment.paypalWebhookId') || '';
    if (!webhookId) throw new BadRequestException('PayPal webhook ID is not configured');

    const accessToken = await this.getPayPalWebhookAccessToken();
    const baseUrl = this.config.get<string>('commerce.payment.paypalBaseUrl') || 'https://api-m.sandbox.paypal.com';

    const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });

    const verification = await verifyResponse.json();
    if (!verifyResponse.ok || verification.verification_status !== 'SUCCESS') {
      throw new BadRequestException('Invalid PayPal webhook signature');
    }

    const eventId = String(event.id || transmissionId);
    const eventType = String(event.event_type || '');

    if (await this.webhookService.isEventProcessed('paypal', eventId)) {
      return { received: true };
    }

    await this.webhookService.recordWebhookEvent({
      provider: 'paypal',
      eventType,
      eventId,
      payload: event,
      status: 'processing',
    });

    try {
      const resource = event.resource || {};
      const customId = String(resource.custom_id || resource.purchase_units?.[0]?.custom_id || '');
      const captureId = String(resource.id || '');
      const amount = Number(resource.amount?.value || 0);
      const currency = String(resource.amount?.currency_code || '');

      if (eventType === 'PAYMENT.CAPTURE.COMPLETED' && customId) {
        await this.webhookService.handlePaymentSuccess({
          orderId: customId,
          paymentIntentId: captureId,
          amount,
          currency,
        });
      }

      await this.webhookService.markEventProcessed('paypal', eventId);
      return { received: true };
    } catch (error) {
      await this.webhookService.markEventFailed(
        'paypal',
        eventId,
        error instanceof Error ? error.message : 'PayPal webhook processing failed',
      );
      throw error;
    }
  }

  private async getPayPalWebhookAccessToken(): Promise<string> {
    const baseUrl = this.config.get<string>('commerce.payment.paypalBaseUrl') || 'https://api-m.sandbox.paypal.com';
    const clientId = this.config.get<string>('commerce.payment.paypalClientId') || '';
    const clientSecret = this.config.get<string>('commerce.payment.paypalClientSecret') || '';

    if (!clientId || !clientSecret) throw new BadRequestException('PayPal credentials are not configured');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    if (!response.ok || !data.access_token) {
      throw new BadRequestException('Failed to authenticate with PayPal');
    }

    return data.access_token;
  }
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
