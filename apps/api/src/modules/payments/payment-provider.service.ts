import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PaymentProviderStatus = {
  provider: string;
  configured: boolean;
  currencySupported: boolean;
  publicKey?: string;
};

/** Safe provider metadata for checkout; credentials never leave the API. */
@Injectable()
export class PaymentProviderService {
  constructor(private readonly config: ConfigService) {}

  status(currency: string): PaymentProviderStatus {
    const provider = this.config.get<string>('commerce.payment.provider', 'none');
    const currencies = this.config.get<string[]>('commerce.supportedCurrencies', ['USD']);
    
    let publicKey: string | undefined;
    if (provider === 'stripe') {
      publicKey = this.config.get<string>('commerce.payment.stripePublishableKey');
    } else if (provider === 'razorpay') {
      publicKey = this.config.get<string>('commerce.payment.razorpayKeyId');
    }

    return {
      provider,
      configured: this.isConfigured(provider),
      currencySupported: currencies.includes(currency.toUpperCase()),
      ...(publicKey && { publicKey }),
    };
  }

  private isConfigured(provider: string): boolean {
    switch (provider) {
      case 'stripe': 
        return Boolean(
          this.config.get<string>('commerce.payment.stripeSecretKey') && 
          this.config.get<string>('commerce.payment.stripePublishableKey')
        );
      case 'razorpay': 
        return Boolean(
          this.config.get<string>('commerce.payment.razorpayKeyId') && 
          this.config.get<string>('commerce.payment.razorpayKeySecret')
        );
      case 'paypal': 
        return Boolean(
          this.config.get<string>('commerce.payment.paypalClientId') && 
          this.config.get<string>('commerce.payment.paypalClientSecret')
        );
      default: 
        return false;
    }
  }
}
