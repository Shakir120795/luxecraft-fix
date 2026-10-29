import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PayPalOrderResult {
  orderId: string;
  status: string;
  approveUrl?: string;
}

export interface PayPalRefundResult {
  refundId: string;
  amount: number;
  currency: string;
  status: string;
}

@Injectable()
export class PayPalProvider {
  private readonly logger = new Logger(PayPalProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly appUrl: string;

  private static readonly supportedCurrencies = new Set([
    'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF',
    'ILS', 'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN',
    'GBP', 'SGD', 'SEK', 'CHF', 'THB', 'USD',
  ]);
  private static readonly zeroDecimalCurrencies = new Set(['HUF', 'JPY', 'TWD']);

  constructor(private readonly config: ConfigService) {
    this.clientId =
      this.config.get<string>('commerce.payment.paypalClientId') || '';
    this.clientSecret =
      this.config.get<string>('commerce.payment.paypalClientSecret') || '';
    this.baseUrl = (
      this.config.get<string>('commerce.payment.paypalBaseUrl') ||
      (process.env.NODE_ENV === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com')
    ).replace(/\/+$/, '');
    this.appUrl = (this.config.get<string>('commerce.appUrl') || 'http://localhost:3000')
      .replace(/\/+$/, '');

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('PayPal credentials not configured');
    } else if (this.isSandboxEndpoint() && process.env.NODE_ENV === 'production' &&
      process.env.PAYPAL_ALLOW_SANDBOX_IN_PRODUCTION?.toLowerCase() !== 'true') {
      this.logger.error(
        'PayPal Sandbox is disabled in production. Configure live PayPal credentials and https://api-m.paypal.com; use PAYPAL_ALLOW_SANDBOX_IN_PRODUCTION=true only for intentional test transactions.',
      );
    } else if (this.isSandboxEndpoint()) {
      this.logger.warn('PayPal is using Sandbox: transactions are tests and do not collect real money.');
    }
  }

  private getAuthHeader(): string {
    if (!this.isConfigured()) {
      throw new BadRequestException('PayPal is not configured');
    }

    return `Basic ${Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64')}`;
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.access_token) {
      const detail = this.describePayPalError(data, 'Check that PayPal client ID, secret and API environment match.');
      this.logger.error(`PayPal OAuth failed: HTTP ${response.status}: ${detail}`);
      throw new BadRequestException(`PayPal authentication failed (HTTP ${response.status}): ${detail}`);
    }

    return data.access_token;
  }

  async createOrder(
    orderId: string,
    amount: number,
    currency: string,
    options?: { customRequestId?: string; guestCheckout?: boolean },
  ): Promise<PayPalOrderResult> {
    const normalizedCurrency = currency.toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('PayPal payment amount must be greater than zero.');
    }
    if (!this.isCurrencySupported(normalizedCurrency)) {
      throw new BadRequestException(
        `PayPal does not support ${normalizedCurrency} for checkout. Choose a supported payment provider or change the store currency.`,
      );
    }

    const accessToken = await this.getAccessToken();
    const encodedOrderId = encodeURIComponent(orderId);
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            custom_id: orderId,
            amount: {
              currency_code: normalizedCurrency,
              value: this.formatAmount(amount, normalizedCurrency),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              user_action: 'PAY_NOW',
              return_url: `${this.appUrl}/order-confirmation?orderId=${encodedOrderId}&paypalReturn=1`,
              cancel_url: options?.customRequestId
                ? `${this.appUrl}/custom-design/requests/${encodeURIComponent(options.customRequestId)}?paypalCancelled=1&orderId=${encodedOrderId}`
                : `${this.appUrl}/checkout?paypalCancelled=1&orderId=${encodedOrderId}${options?.guestCheckout ? '&guest=true' : ''}`,
            },
          },
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.id) {
      const detail = this.describePayPalError(data, 'Verify the PayPal business account and API credentials.');
      this.logger.error(`PayPal order creation failed: HTTP ${response.status}: ${detail}`);
      throw new BadRequestException(`PayPal order creation failed (HTTP ${response.status}): ${detail}`);
    }

    const approveUrl = Array.isArray(data.links)
      ? data.links.find((link: { rel?: string; href?: string }) =>
          ['approve', 'payer-action'].includes(String(link.rel || '').toLowerCase()),
        )?.href
      : undefined;

    if (!approveUrl) {
      this.logger.error(`PayPal order ${data.id} was created without an approval link.`);
      throw new BadRequestException('PayPal did not return an approval link. Check the PayPal app and merchant account configuration.');
    }

    this.logger.log(`PayPal order created: ${data.id} for ${orderId}`);

    return {
      orderId: data.id,
      status: data.status,
      approveUrl,
    };
  }

  async captureOrder(paypalOrderId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = this.describePayPalError(data, 'The buyer may not have approved the order yet.');
      this.logger.error(`PayPal capture failed: HTTP ${response.status}: ${detail}`);
      throw new BadRequestException(`PayPal capture failed (HTTP ${response.status}): ${detail}`);
    }

    return data;
  }

  async fetchOrder(paypalOrderId: string): Promise<Record<string, unknown>> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();
    if (!response.ok || !data?.id) {
      this.logger.error(`PayPal order lookup failed: ${response.status}`);
      throw new BadRequestException('Unable to retrieve PayPal order status');
    }

    return data as Record<string, unknown>;
  }

  async refundOrder(
    paypalOrderId: string,
    amount: number,
    currency: string,
    requestId: string,
  ): Promise<PayPalRefundResult> {
    const accessToken = await this.getAccessToken();

    const orderResponse = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      this.logger.error(`PayPal order lookup for refund failed: ${orderResponse.status}`);
      throw new BadRequestException('Unable to verify PayPal payment for refund');
    }

    const captures = (Array.isArray(orderData.purchase_units)
      ? orderData.purchase_units
      : []
    ).flatMap((unit: any) =>
      Array.isArray(unit?.payments?.captures) ? unit.payments.captures : [],
    );

    const capture = captures.find(
      (item: any) =>
        String(item?.status || '').toUpperCase() === 'COMPLETED' && item?.id,
    );

    if (!capture?.id) {
      throw new BadRequestException('No completed PayPal capture is available for refund');
    }

    const captureAmount = Number(capture?.amount?.value || 0);
    const captureCurrency = String(capture?.amount?.currency_code || '').toUpperCase();

    if (
      !Number.isFinite(captureAmount) ||
      captureCurrency !== currency.toUpperCase() ||
      captureAmount < amount - 0.01
    ) {
      throw new BadRequestException('PayPal capture amount or currency does not match the refund');
    }

    const refundResponse = await fetch(
      `${this.baseUrl}/v2/payments/captures/${encodeURIComponent(capture.id)}/refund`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
          'PayPal-Request-Id': requestId,
        },
        body: JSON.stringify({
          amount: {
            currency_code: captureCurrency,
            value: this.formatAmount(amount, captureCurrency),
          },
        }),
      },
    );

    const refundData = await refundResponse.json();

    if (!refundResponse.ok || !refundData.id) {
      this.logger.error(`PayPal refund failed: ${refundResponse.status}`);
      throw new BadRequestException('Failed to process PayPal refund');
    }

    const status = String(refundData.status || '').toUpperCase();
    if (status !== 'COMPLETED') {
      this.logger.error(`PayPal refund not completed: ${status || 'UNKNOWN'}`);
      throw new BadRequestException(
        `PayPal refund is not completed: ${status || 'UNKNOWN'}`,
      );
    }

    return {
      refundId: String(refundData.id),
      amount: Number(refundData.amount?.value || amount),
      currency: String(
        refundData.amount?.currency_code || captureCurrency,
      ).toUpperCase(),
      status,
    };
  }

  isCurrencySupported(currency: string): boolean {
    return PayPalProvider.supportedCurrencies.has(currency.toUpperCase());
  }

  private formatAmount(amount: number, currency: string): string {
    const normalizedCurrency = currency.toUpperCase();
    const decimals = PayPalProvider.zeroDecimalCurrencies.has(normalizedCurrency) ? 0 : 2;
    if (decimals === 0 && Math.abs(amount - Math.round(amount)) > 0.00001) {
      throw new BadRequestException(
        `PayPal requires a whole-number amount for ${normalizedCurrency}. Please correct the quote or product price before payment.`,
      );
    }
    return amount.toFixed(decimals);
  }

  private describePayPalError(data: any, fallback: string): string {
    const details = Array.isArray(data?.details)
      ? data.details
          .map((item: any) => [item?.issue, item?.description].filter(Boolean).join(': '))
          .filter(Boolean)
          .join('; ')
      : '';
    return String(data?.error_description || data?.message || details || data?.name || fallback)
      .slice(0, 280);
  }

  private isSandboxEndpoint(): boolean {
    try {
      return new URL(this.baseUrl).hostname === 'api-m.sandbox.paypal.com';
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    if (!this.clientId || !this.clientSecret || !this.baseUrl) return false;

    // A deployed production storefront must never silently accept test-only
    // PayPal payments. Sandbox on production requires an explicit opt-in.
    if (
      process.env.NODE_ENV === 'production' &&
      this.isSandboxEndpoint() &&
      process.env.PAYPAL_ALLOW_SANDBOX_IN_PRODUCTION?.toLowerCase() !== 'true'
    ) {
      return false;
    }

    return true;
  }

  getClientId(): string {
    return this.clientId;
  }
}
