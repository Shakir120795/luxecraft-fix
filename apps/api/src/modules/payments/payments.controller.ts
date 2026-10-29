import { Body, Controller, Get, Post, Query, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { getGuestOrderAccessCookieName } from '../orders/guest-order-access';
import { CryptoProvider } from './providers/crypto.provider';
import { WebhookService } from './webhook.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @Post('resume')
  async resumePayment(
    @Body() body: { orderId: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (!body.orderId || !req.user?.id) {
      throw new BadRequestException('orderId is required');
    }

    const order = req.user?.id
      ? await this.orders.findOneForUser(body.orderId, req.user.id)
      : await this.orders.findOneForGuest(
          body.orderId,
          req.cookies?.[getGuestOrderAccessCookieName(body.orderId)] ?? '',
        );

    if (order.paymentStatus !== PaymentStatus.PENDING || order.orderStatus === 'CANCELLED') {
      throw new BadRequestException('This order is not available for payment resume.');
    }

    const pendingPayment = order.payments.find(
      (item) => item.status === PaymentStatus.PENDING || item.status === PaymentStatus.AUTHORIZED,
    );

    if (!pendingPayment || !['razorpay', 'paypal', 'crypto'].includes(pendingPayment.provider)) {
      throw new BadRequestException('No resumable payment is available for this order.');
    }

    if (pendingPayment.provider === 'crypto') {
      const metadata =
        pendingPayment.metadata &&
        typeof pendingPayment.metadata === 'object' &&
        !Array.isArray(pendingPayment.metadata)
          ? (pendingPayment.metadata as Record<string, unknown>)
          : {};
      const network = String(metadata.network || '').trim().toLowerCase();
      const asset = String(metadata.asset || '').trim().toUpperCase();
      const address = String(metadata.receivingAddress || '').trim();
      const amount = Number(metadata.expectedAmount || pendingPayment.amount);

      if (!network || !asset || !address || !Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException('Crypto payment details are invalid for this order.');
      }

      const crypto = this.crypto.createPayment(amount, network, asset);

      return {
        success: true,
        orderId: order.id,
        payment: pendingPayment,
        provider: 'crypto',
        crypto,
      };
    }

    if (!req.user?.id) {
      throw new BadRequestException('Please sign in to resume this payment.');
    }

    const claimed = await this.payments.cancelPendingPayment(pendingPayment.id);
    if (!claimed) {
      throw new BadRequestException('Payment is already being resumed. Please try again.');
    }

    try {
      const result = await this.payments.createPayment({
        orderId: order.id,
        amount: Number(order.total),
        currency: order.currency,
        provider: pendingPayment.provider,
        paymentMethod: pendingPayment.paymentMethod || undefined,
        metadata: {
          orderNumber: order.orderNumber,
          retryOfPaymentId: pendingPayment.id,
        },
      });

      return {
        success: true,
        orderId: order.id,
        payment: result.payment,
        provider: result.provider,
        providerOrderId: result.providerOrderId,
        publicKey: result.publicKey,
        approveUrl: result.approveUrl,
        crypto: result.crypto,
      };
    } catch (error) {
      await this.payments.updateStatus(pendingPayment.id, PaymentStatus.PENDING);
      throw error;
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('reconcile')
  async reconcilePayment(
    @Body() body: { orderId: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (!body.orderId) {
      throw new BadRequestException('orderId is required');
    }

    const order = req.user?.id
      ? await this.orders.findOneForUser(body.orderId, req.user.id)
      : await this.orders.findOneForGuest(
          body.orderId,
          req.cookies?.[getGuestOrderAccessCookieName(body.orderId)] ?? '',
        );

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { success: true, alreadyProcessed: true, orderId: order.id };
    }

    const payment = order.payments.find(
      (item) =>
        ['razorpay', 'paypal'].includes(item.provider) &&
        (item.status === PaymentStatus.PENDING || item.status === PaymentStatus.AUTHORIZED),
    );

    if (!payment) {
      throw new BadRequestException('No pending card payment is available to reconcile for this order.');
    }

    const metadata =
      payment.metadata &&
      typeof payment.metadata === 'object' &&
      !Array.isArray(payment.metadata)
        ? (payment.metadata as Record<string, unknown>)
        : {};

    let paymentIntentId = '';
    let capturedAmount = 0;
    let capturedCurrency = '';
    let captureReference = '';

    if (payment.provider === 'razorpay') {
      const razorpayOrderId = String(metadata.razorpayOrderId || '');
      const razorpayPaymentId = String(payment.providerPaymentId || '');

      if (!razorpayOrderId || !razorpayPaymentId || razorpayPaymentId === razorpayOrderId) {
        throw new BadRequestException(
          'Razorpay has not provided a captured payment reference yet. Wait briefly and check again; do not pay again.',
        );
      }

      const providerPayment = await this.payments.fetchRazorpayPayment(razorpayPaymentId);
      if (
        providerPayment.orderId !== razorpayOrderId ||
        providerPayment.status !== 'captured'
      ) {
        throw new BadRequestException(
          'No captured Razorpay payment was found for this order. The order has not been marked as paid.',
        );
      }
      if (
        Math.abs(providerPayment.amount - Number(payment.amount)) > 0.01 ||
        providerPayment.currency !== payment.currency.toUpperCase()
      ) {
        throw new BadRequestException('Razorpay payment amount or currency does not match this order.');
      }

      paymentIntentId = razorpayOrderId;
      capturedAmount = providerPayment.amount;
      capturedCurrency = providerPayment.currency;
      captureReference = providerPayment.id;
    } else {
      const paypalOrderId = String(metadata.paypalOrderId || payment.providerPaymentId || '');
      if (!paypalOrderId || payment.providerPaymentId !== paypalOrderId) {
        throw new BadRequestException('The PayPal order reference is missing or does not match this order.');
      }

      const providerOrder = await this.payments.fetchPayPalOrder(paypalOrderId);
      const purchaseUnits = Array.isArray(providerOrder.purchase_units)
        ? providerOrder.purchase_units as Array<Record<string, unknown>>
        : [];
      const captures = purchaseUnits.flatMap((unit) => {
        const unitPayments = unit.payments as Record<string, unknown> | undefined;
        return Array.isArray(unitPayments?.captures)
          ? (unitPayments.captures as Array<Record<string, unknown>>).map((capture) => ({
              capture,
              unit,
            }))
          : [];
      });
      const completedCapture = captures.find(
        ({ capture }) => String(capture.status || '').toUpperCase() === 'COMPLETED',
      );

      if (!completedCapture) {
        throw new BadRequestException(
          'No completed PayPal capture was found for this order. The order has not been marked as paid.',
        );
      }

      const amount = completedCapture.capture.amount as Record<string, unknown> | undefined;
      const capturedCustomId = String(
        completedCapture.capture.custom_id || completedCapture.unit.custom_id || '',
      );
      capturedAmount = Number(amount?.value || 0);
      capturedCurrency = String(amount?.currency_code || '').toUpperCase();
      captureReference = String(completedCapture.capture.id || paypalOrderId);
      paymentIntentId = paypalOrderId;

      if (capturedCustomId && capturedCustomId !== order.id) {
        throw new BadRequestException('The PayPal capture does not match this order.');
      }
      if (
        !Number.isFinite(capturedAmount) ||
        Math.abs(capturedAmount - Number(payment.amount)) > 0.01 ||
        capturedCurrency !== payment.currency.toUpperCase()
      ) {
        throw new BadRequestException('PayPal captured amount or currency does not match this order.');
      }
    }

    await this.webhooks.handlePaymentSuccess({
      orderId: order.id,
      paymentIntentId,
      paymentId: payment.id,
      amount: capturedAmount,
      currency: capturedCurrency,
    });

    return {
      success: true,
      reconciled: true,
      provider: payment.provider,
      paymentReference: captureReference,
      orderId: order.id,
    };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('razorpay/verify')
  async verifyRazorpayPayment(
    @Body() body: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (!body.orderId || !body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
      throw new BadRequestException('orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required');
    }

    const order = req.user?.id
      ? await this.orders.findOneForUser(body.orderId, req.user.id)
      : await this.orders.findOneForGuest(
          body.orderId,
          req.cookies?.[getGuestOrderAccessCookieName(body.orderId)] ?? '',
        );

    const payment = order.payments.find((item) => {
      if (item.provider !== 'razorpay') return false;
      if (
        item.providerPaymentId === body.razorpayOrderId ||
        item.providerPaymentId === body.razorpayPaymentId
      ) {
        return true;
      }
      const metadata =
        item.metadata &&
        typeof item.metadata === 'object' &&
        !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : {};
      return String(metadata.razorpayOrderId || '') === body.razorpayOrderId;
    });

    if (!payment) {
      throw new BadRequestException('Razorpay payment is not pending for this order');
    }

    const paymentMetadata =
      payment.metadata &&
      typeof payment.metadata === 'object' &&
      !Array.isArray(payment.metadata)
        ? (payment.metadata as Record<string, unknown>)
        : {};
    if (
      payment.providerPaymentId !== body.razorpayOrderId &&
      payment.providerPaymentId !== body.razorpayPaymentId &&
      String(paymentMetadata.razorpayOrderId || '') !== body.razorpayOrderId
    ) {
      throw new BadRequestException('Razorpay order does not match this payment');
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

    // The webhook may confirm the order before the browser callback returns.
    if (
      order.paymentStatus === PaymentStatus.PAID &&
      payment.status === PaymentStatus.PAID
    ) {
      return {
        success: true,
        verified: true,
        alreadyProcessed: true,
        paymentId: body.razorpayPaymentId,
        orderId: order.id,
      };
    }

    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.AUTHORIZED) {
      throw new BadRequestException('This Razorpay checkout session is no longer active. Please continue with the currently selected payment method.');
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('This order is no longer awaiting payment');
    }

    if (await this.webhooks.isEventProcessed('razorpay', body.razorpayPaymentId)) {
      throw new BadRequestException('This Razorpay payment has already been processed');
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
        paymentId: payment.id,
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
  @Post('paypal/cancel')
  async cancelPayPalApproval(
    @Body() body: { orderId: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (!body.orderId) {
      throw new BadRequestException('orderId is required');
    }

    // An order must belong to the signed-in customer, or be protected by the
    // guest-order access cookie created during checkout.
    const order = req.user?.id
      ? await this.orders.findOneForUser(body.orderId, req.user.id)
      : await this.orders.findOneForGuest(
          body.orderId,
          req.cookies?.[getGuestOrderAccessCookieName(body.orderId)] ?? '',
        );

    const paypalPayment = order.payments.find(
      (item) => item.provider === 'paypal' &&
        (item.status === PaymentStatus.PENDING || item.status === PaymentStatus.AUTHORIZED),
    );

    if (!paypalPayment) {
      const alreadyPaid = order.paymentStatus === PaymentStatus.PAID ||
        order.payments.some((item) => item.provider === 'paypal' && item.status === PaymentStatus.PAID);
      return {
        success: true,
        alreadyProcessed: true,
        alreadyPaid,
      };
    }

    const metadata =
      paypalPayment.metadata &&
      typeof paypalPayment.metadata === 'object' &&
      !Array.isArray(paypalPayment.metadata)
        ? (paypalPayment.metadata as Record<string, unknown>)
        : {};
    const paypalOrderId = String(metadata.paypalOrderId || paypalPayment.providerPaymentId || '');
    if (!paypalOrderId || paypalPayment.providerPaymentId !== paypalOrderId) {
      throw new BadRequestException('PayPal order reference does not match this checkout.');
    }

    // Reuse the single failure/release transaction so cancelled approvals do
    // not strand reserved inventory or coupon capacity.
    await this.webhooks.handlePaymentFailed({
      orderId: order.id,
      paymentIntentId: paypalOrderId,
      reason: 'Buyer cancelled PayPal approval.',
    });

    return { success: true, cancelled: true };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('paypal/capture')
  async capturePayPalPayment(
    @Body() body: { orderId: string; paypalOrderId: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (!body.orderId || !body.paypalOrderId) {
      throw new BadRequestException('orderId and paypalOrderId are required');
    }

    const order = req.user?.id
      ? await this.orders.findOneForUser(body.orderId, req.user.id)
      : await this.orders.findOneForGuest(
          body.orderId,
          req.cookies?.[getGuestOrderAccessCookieName(body.orderId)] ?? '',
        );

    const payment = order.payments.find((item) => {
      if (item.provider !== 'paypal') return false;
      if (item.providerPaymentId === body.paypalOrderId) return true;
      const metadata =
        item.metadata &&
        typeof item.metadata === 'object' &&
        !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : {};
      return String(metadata.paypalOrderId || '') === body.paypalOrderId;
    });

    if (!payment) {
      throw new BadRequestException('PayPal payment was not found for this order');
    }

    const paymentMetadata =
      payment.metadata &&
      typeof payment.metadata === 'object' &&
      !Array.isArray(payment.metadata)
        ? (payment.metadata as Record<string, unknown>)
        : {};
    if (
      payment.providerPaymentId !== body.paypalOrderId &&
      String(paymentMetadata.paypalOrderId || '') !== body.paypalOrderId
    ) {
      throw new BadRequestException('PayPal order does not match this payment');
    }

    // PayPal's webhook can finish the order before the browser returns from approval.
    if (
      order.paymentStatus === PaymentStatus.PAID &&
      payment.status === PaymentStatus.PAID
    ) {
      return {
        success: true,
        captured: true,
        alreadyProcessed: true,
        paypalOrderId: body.paypalOrderId,
        orderId: order.id,
      };
    }

    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.AUTHORIZED) {
      throw new BadRequestException('This PayPal checkout session is no longer active. Please continue with the currently selected payment method.');
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('This order is no longer awaiting payment');
    }

    let capture: Record<string, unknown>;
    try {
      capture = await this.payments.capturePayPalOrder(body.paypalOrderId);
    } catch (captureError) {
      // A retry after a successful remote capture must reconcile the existing order,
      // not require another capture attempt or risk charging the customer twice.
      const existingOrder = await this.payments.fetchPayPalOrder(body.paypalOrderId).catch(() => null);
      const existingUnits = Array.isArray(existingOrder?.purchase_units)
        ? existingOrder.purchase_units as Array<Record<string, unknown>>
        : [];
      const hasCompletedCapture = existingUnits.some((unit) => {
        const unitPayments = unit.payments as Record<string, unknown> | undefined;
        const captures = Array.isArray(unitPayments?.captures)
          ? unitPayments.captures as Array<Record<string, unknown>>
          : [];
        return captures.some((entry) => String(entry.status || '').toUpperCase() === 'COMPLETED');
      });
      if (!existingOrder || !hasCompletedCapture) throw captureError;
      capture = existingOrder;
    }
    const purchaseUnit = Array.isArray(capture.purchase_units)
      ? capture.purchase_units[0] as Record<string, unknown> | undefined
      : undefined;
    const purchaseAmount = purchaseUnit?.amount as Record<string, unknown> | undefined;
    const payments = purchaseUnit?.payments as Record<string, unknown> | undefined;
    const captures = Array.isArray(payments?.captures)
      ? payments.captures as Array<Record<string, unknown>>
      : [];
    const firstCapture =
      captures.find((entry) => String(entry.status || '').toUpperCase() === 'COMPLETED') ??
      captures[0];
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
      const latestOrder = req.user?.id
        ? await this.orders.findOneForUser(body.orderId, req.user.id)
        : await this.orders.findOneForGuest(
            body.orderId,
            req.cookies?.[getGuestOrderAccessCookieName(body.orderId)] ?? '',
          );
      const latestPayment = latestOrder.payments.find(
        (item) =>
          item.provider === 'paypal' &&
          (item.providerPaymentId === body.paypalOrderId ||
            String(
              item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
                ? (item.metadata as Record<string, unknown>).paypalOrderId || ''
                : '',
            ) === body.paypalOrderId),
      );
      if (
        latestOrder.paymentStatus === PaymentStatus.PAID &&
        latestPayment?.status === PaymentStatus.PAID
      ) {
        return {
          success: true,
          captured: true,
          alreadyProcessed: true,
          captureId,
          paypalOrderId: body.paypalOrderId,
          orderId: latestOrder.id,
        };
      }
      throw new BadRequestException('PayPal capture has already been processed; check the order status before retrying.');
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
  async verifyCryptoPayment(
    @Body() body: { orderId: string; txHash: string; network: string; asset: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    if (!body.orderId || !body.txHash || !body.network || !body.asset) {
      throw new BadRequestException(
        'orderId, txHash, network and asset are required',
      );
    }

    const networkInput = body.network.trim().toLowerCase();
    const txHash = networkInput === 'solana'
      ? body.txHash.trim()
      : body.txHash.trim().toLowerCase();

    if (!txHash) {
      throw new BadRequestException('Transaction hash is required');
    }

    const order = req.user?.id
      ? await this.orders.findOneForUser(body.orderId, req.user.id)
      : await this.orders.findOneForGuest(
          body.orderId,
          req.cookies?.[getGuestOrderAccessCookieName(body.orderId)] ?? '',
        );

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('This order is no longer awaiting payment');
    }

    const payment = order.payments.find(
      (item) => item.provider === 'crypto' && (item.status === PaymentStatus.PENDING || item.status === PaymentStatus.AUTHORIZED),
    );
    if (!payment) {
      throw new BadRequestException('Crypto payment is not pending for this order');
    }

    const metadata =
      payment.metadata &&
      typeof payment.metadata === 'object' &&
      !Array.isArray(payment.metadata)
        ? (payment.metadata as Record<string, unknown>)
        : {};

    const expectedNetwork = String(metadata.network || '').trim().toLowerCase();
    const expectedAsset = String(metadata.asset || '').trim().toUpperCase();

    if (networkInput !== expectedNetwork) {
      throw new BadRequestException('Network does not match the order payment details');
    }

    const existingCryptoPayment = await this.payments.findCryptoPaymentByTransactionHash(txHash);
    if (existingCryptoPayment) {
      throw new BadRequestException(
        'This transaction has already been used for a payment and cannot be reused.',
      );
    }
    const receivingAddress = String(metadata.receivingAddress || '').trim();
    const expectedAmount = Number(metadata.expectedAmount || payment.amount);

    if (
      expectedNetwork !== body.network.trim().toLowerCase() ||
      expectedAsset !== body.asset.trim().toUpperCase()
    ) {
      throw new BadRequestException(
        'Network or asset does not match the order payment details',
      );
    }

    if (!receivingAddress || !Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      throw new BadRequestException('Crypto payment configuration is invalid for this order');
    }

    const verification = await this.crypto.verifyTransaction({
      txHash,
      network: expectedNetwork,
      asset: expectedAsset,
      expectedAmount,
      receivingAddress,
    });

    if (!verification.verified) {
      throw new BadRequestException('Blockchain payment could not be verified');
    }

    const eventId = `${expectedNetwork}:${txHash}`;

    await this.webhooks.handlePaymentSuccess({
      orderId: order.id,
      paymentIntentId: txHash,
      paymentId: payment.id,
      cryptoTransactionHash: eventId,
      amount: verification.amountReceived,
      currency: order.currency,
      cryptoEvent: {
        eventId,
        payload: {
          orderId: order.id,
          txHash,
          network: expectedNetwork,
          asset: expectedAsset,
          amountReceived: verification.amountReceived,
        },
      },
    });

    return {
      success: true,
      verified: true,
      amountReceived: verification.amountReceived,
      txHash,
    };
  }
}