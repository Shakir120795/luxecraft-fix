import { Body, Controller, Get, Post, Query, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { CryptoProvider } from './providers/crypto.provider';
import { WebhookService } from './webhook.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentStatus } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly providers: PaymentProviderService,
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
    private readonly crypto: CryptoProvider,
    private readonly webhooks: WebhookService,
  ) {}

  /**
   * Get payment provider configuration (safe for frontend)
   * Returns: provider name, configured status, currency support, publishable key
   * Endpoint: GET /api/v1/payments/configuration?currency=USD
   */
  @Public()
  @Get('configuration')
  configuration(@Query('currency') currency = 'USD') {
    return this.providers.status(currency);
  }
  @UseGuards(OptionalJwtAuthGuard)
  @Post('razorpay/verify')
  async verifyRazorpayPayment(
    @Body() body: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; accessToken?: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (!body.orderId || !body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
      throw new BadRequestException('orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required');
    }

    const order = req.user?.id
      ? await this.orders.findOneForUser(body.orderId, req.user.id)
      : await this.orders.findOneForGuest(body.orderId, body.accessToken || '');

    const payment = order.payments.find(
      (item) => item.provider === 'razorpay' && item.status !== PaymentStatus.PAID,
    );

    if (!payment) {
      throw new BadRequestException('Razorpay payment is not pending for this order');
    }

    if (payment.providerPaymentId !== body.razorpayOrderId) {
      throw new BadRequestException('Razorpay order does not match this payment');
    }

    if (await this.webhooks.isEventProcessed('razorpay', body.razorpayPaymentId)) {
      throw new BadRequestException('This Razorpay payment has already been processed');
    }

    const verified = this.payments.verifyRazorpaySignature(
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature,
    );

    if (!verified) {
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    const providerPayment = await this.payments.fetchRazorpayPayment(
      body.razorpayPaymentId,
    );

    if (
      providerPayment.orderId !== body.razorpayOrderId ||
      providerPayment.status !== 'captured'
    ) {
      throw new BadRequestException('Razorpay payment is not captured for this order');
    }

    if (
      Math.abs(providerPayment.amount - Number(payment.amount)) > 0.01 ||
      providerPayment.currency !== payment.currency.toUpperCase()
    ) {
      throw new BadRequestException('Razorpay payment amount or currency does not match the order');
    }

    await this.webhooks.recordWebhookEvent({
      provider: 'razorpay',
      eventType: 'payment.verified',
      eventId: body.razorpayPaymentId,
      payload: {
        orderId: order.id,
        razorpayOrderId: body.razorpayOrderId,
        razorpayPaymentId: body.razorpayPaymentId,
      },
      status: 'processing',
    });

    try {
      await this.payments.updateStatus(
        payment.id,
        PaymentStatus.PENDING,
        body.razorpayPaymentId,
      );

      await this.webhooks.handlePaymentSuccess({
        orderId: order.id,
        paymentIntentId: body.razorpayOrderId,
        amount: providerPayment.amount,
        currency: providerPayment.currency,
      });

      await this.webhooks.markEventProcessed('razorpay', body.razorpayPaymentId);
    } catch (error) {
      await this.webhooks.markEventFailed(
        'razorpay',
        body.razorpayPaymentId,
        error instanceof Error ? error.message : 'Razorpay payment processing failed',
      );
      throw error;
    }

    return {
      success: true,
      verified: true,
      paymentId: body.razorpayPaymentId,
      orderId: order.id,
    };
  }
  @UseGuards(OptionalJwtAuthGuard)
  @Post('paypal/capture')
  async capturePayPalPayment(
    @Body() body: { orderId: string; paypalOrderId: string; accessToken?: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (!body.orderId || !body.paypalOrderId) {
      throw new BadRequestException('orderId and paypalOrderId are required');
    }

    const order = req.user?.id
      ? await this.orders.findOneForUser(body.orderId, req.user.id)
      : await this.orders.findOneForGuest(body.orderId, body.accessToken || '');

    const payment = order.payments.find(
      (item) => item.provider === 'paypal' && item.status !== PaymentStatus.PAID,
    );

    if (!payment) {
      throw new BadRequestException('PayPal payment is not pending for this order');
    }

    if (payment.providerPaymentId !== body.paypalOrderId) {
      throw new BadRequestException('PayPal order does not match this payment');
    }

    const capture = await this.payments.capturePayPalOrder(body.paypalOrderId);
    const purchaseUnit = Array.isArray(capture.purchase_units)
      ? capture.purchase_units[0] as Record<string, unknown> | undefined
      : undefined;
    const purchaseAmount = purchaseUnit?.amount as Record<string, unknown> | undefined;
    const payments = purchaseUnit?.payments as Record<string, unknown> | undefined;
    const captures = Array.isArray(payments?.captures)
      ? payments.captures as Array<Record<string, unknown>>
      : [];
    const firstCapture = captures[0];
    const firstCaptureAmount = firstCapture?.amount as Record<string, unknown> | undefined;
    const captureStatus = String(firstCapture?.status || capture.status || '').toUpperCase();
    const captureId = String(firstCapture?.id || body.paypalOrderId);
    const capturedAmount = Number(firstCaptureAmount?.value || purchaseAmount?.value || 0);
    const capturedCurrency = String(
      firstCaptureAmount?.currency_code || purchaseAmount?.currency_code || '',
    ).toUpperCase();
    const capturedCustomId = String(
      firstCapture?.custom_id || purchaseUnit?.custom_id || '',
    );

    if (captureStatus !== 'COMPLETED') {
      throw new BadRequestException('PayPal capture was not completed: ' + (captureStatus || 'UNKNOWN'));
    }
    if (capturedCustomId && capturedCustomId !== order.id) {
      throw new BadRequestException('PayPal capture does not match this order');
    }
    if (
      !Number.isFinite(capturedAmount) ||
      Math.abs(capturedAmount - Number(payment.amount)) > 0.01 ||
      capturedCurrency !== payment.currency.toUpperCase()
    ) {
      throw new BadRequestException('PayPal captured amount or currency does not match the order');
    }

    if (await this.webhooks.isEventProcessed('paypal', captureId)) {
      throw new BadRequestException('This PayPal capture has already been processed');
    }

    await this.webhooks.recordWebhookEvent({
      provider: 'paypal',
      eventType: 'payment.captured',
      eventId: captureId,
      payload: {
        orderId: order.id,
        paypalOrderId: body.paypalOrderId,
        captureId,
        status: captureStatus,
      },
      status: 'processing',
    });

    try {
      await this.webhooks.handlePaymentSuccess({
        orderId: order.id,
        paymentIntentId: body.paypalOrderId,
        amount: capturedAmount,
        currency: capturedCurrency,
      });

      await this.webhooks.markEventProcessed('paypal', captureId);
    } catch (error) {
      await this.webhooks.markEventFailed(
        'paypal',
        captureId,
        error instanceof Error ? error.message : 'PayPal capture processing failed',
      );
      throw error;
    }

    return {
      success: true,
      captured: true,
      captureId,
      paypalOrderId: body.paypalOrderId,
      orderId: order.id,
    };
  }
  @UseGuards(OptionalJwtAuthGuard)
  @Post('crypto/verify')
  async verifyCryptoPayment(@Body() body: { orderId: string; txHash: string; network: string; asset: string; accessToken?: string }, @Req() req: Request & { user?: { id: string } }) {
    if (!body.orderId || !body.txHash || !body.network || !body.asset) throw new BadRequestException('orderId, txHash, network and asset are required');
    const order = req.user?.id ? await this.orders.findOneForUser(body.orderId, req.user.id) : await this.orders.findOneForGuest(body.orderId, body.accessToken || '');
    const payment = order.payments.find((item) => item.provider === 'crypto' && item.status !== 'PAID');
    if (!payment) throw new BadRequestException('Crypto payment is not pending for this order');
    if (await this.webhooks.isEventProcessed('crypto', body.txHash)) throw new BadRequestException('This transaction has already been processed');
    const metadata = payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata) ? payment.metadata as Record<string, unknown> : {};
    const expectedNetwork = String(metadata.network || '').toLowerCase();
    const expectedAsset = String(metadata.asset || '').toUpperCase();
    const receivingAddress = String(metadata.receivingAddress || '');
    const expectedAmount = Number(metadata.expectedAmount || payment.amount);
    if (expectedNetwork !== body.network.toLowerCase() || expectedAsset !== body.asset.toUpperCase()) throw new BadRequestException('Network or asset does not match the order payment details');
    const verification = await this.crypto.verifyTransaction({ txHash: body.txHash.trim(), network: expectedNetwork, asset: expectedAsset, expectedAmount, receivingAddress });
    if (!verification.verified) throw new BadRequestException('Blockchain payment could not be verified');
    await this.webhooks.recordWebhookEvent({ provider: 'crypto', eventType: 'payment.verified', eventId: body.txHash, payload: { orderId: order.id, txHash: body.txHash, network: expectedNetwork, asset: expectedAsset, amountReceived: verification.amountReceived }, status: 'processing' });
    try {
      await this.payments.updateStatus(payment.id, PaymentStatus.PENDING, body.txHash);
      await this.webhooks.handlePaymentSuccess({ orderId: order.id, paymentIntentId: body.txHash, amount: verification.amountReceived, currency: order.currency });
      await this.webhooks.markEventProcessed('crypto', body.txHash);
    } catch (error) {
      await this.webhooks.markEventFailed('crypto', body.txHash, error instanceof Error ? error.message : 'Crypto verification processing failed');
      throw error;
    }
    return { success: true, verified: true, amountReceived: verification.amountReceived, txHash: body.txHash };
  }
}