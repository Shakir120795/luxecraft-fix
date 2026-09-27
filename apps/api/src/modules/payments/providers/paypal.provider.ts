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

  constructor(private readonly config: ConfigService) {
    this.clientId =
      this.config.get<string>('commerce.payment.paypalClientId') || '';
    this.clientSecret =
      this.config.get<string>('commerce.payment.paypalClientSecret') || '';
    this.baseUrl =
      this.config.get<string>('commerce.payment.paypalBaseUrl') ||
      'https://api-m.sandbox.paypal.com';

    if (!this.isConfigured()) {
      this.logger.warn('PayPal credentials not configured');
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

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      this.logger.error(`PayPal OAuth failed: ${response.status}`);
      throw new BadRequestException('Failed to authenticate with PayPal');
    }

    return data.access_token;
  }

  async createOrder(
    orderId: string,
    amount: number,
    currency: string,
  ): Promise<PayPalOrderResult> {
    const accessToken = await this.getAccessToken();

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
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      this.logger.error(`PayPal order creation failed: ${response.status}`);
      throw new BadRequestException('Failed to create PayPal order');
    }

    this.logger.log(`PayPal order created: ${data.id} for ${orderId}`);

    const approveUrl = Array.isArray(data.links)
      ? data.links.find((link: { rel?: string; href?: string }) => link.rel === 'approve')?.href
      : undefined;

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

    const data = await response.json();

    if (!response.ok) {
      this.logger.error(`PayPal capture failed: ${response.status}`);
      throw new BadRequestException('Failed to capture PayPal payment');
    }

    return data;
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
            value: amount.toFixed(2),
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

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.baseUrl);
  }

  getClientId(): string {
    return this.clientId;
  }
}
