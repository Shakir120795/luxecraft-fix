import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoProvider, CryptoPaymentOption } from './providers/crypto.provider';

export type PaymentProviderStatus = {
  provider: string;
  providers: string[];
  configured: boolean;
  currencySupported: boolean;
  publicKey?: string;
  cryptoNetworks?: string[];
  cryptoSupportedAssets?: string[];
  cryptoPaymentOptions?: CryptoPaymentOption[];
};

/** Safe provider metadata for checkout; credentials never leave the API. */
@Injectable()
export class PaymentProviderService {
  constructor(
    private readonly config: ConfigService,
    private readonly cryptoProvider: CryptoProvider,
  ) {}

  status(currency: string): PaymentProviderStatus {
    const configuredProvider = this.config.get<string>(
      'commerce.payment.provider',
      'none',
    );

    const configuredProviders = this.config.get<string[]>(
      'commerce.payment.providers',
      [],
    );

    const currencies = this.config.get<string[]>(
      'commerce.supportedCurrencies',
      ['USD'],
    );

    const providers = configuredProviders.filter((candidate) =>
      this.isConfigured(candidate) &&
      (candidate.toLowerCase() !== 'crypto' || currency.toUpperCase() === 'USD'),
    );

    let publicKey: string | undefined;

    if (configuredProvider === 'razorpay') {
      publicKey = this.config.get<string>(
        'commerce.payment.razorpayKeyId',
      );
    } else if (configuredProvider === 'paypal') {
      publicKey = this.config.get<string>(
        'commerce.payment.paypalClientId',
      );
    }

    const cryptoPaymentOptions = this.cryptoProvider.getConfiguredPaymentOptions();
    const cryptoNetworks = Array.from(
      new Set(cryptoPaymentOptions.map((option) => option.network)),
    );
    const cryptoSupportedAssets = Array.from(
      new Set(cryptoPaymentOptions.map((option) => option.asset)),
    );

    return {
      provider: configuredProvider,
      providers,
      configured: this.isConfigured(configuredProvider),
      currencySupported: currencies.includes(currency.toUpperCase()),
      ...(publicKey ? { publicKey } : {}),
      ...(cryptoPaymentOptions.length > 0
        ? { cryptoNetworks, cryptoSupportedAssets, cryptoPaymentOptions }
        : {}),
    };
  }

  private isConfigured(provider: string): boolean {
    switch (provider.toLowerCase()) {
      case 'razorpay':
        return Boolean(
          this.config.get<string>('commerce.payment.razorpayKeyId') &&
            this.config.get<string>('commerce.payment.razorpayKeySecret'),
        );

      case 'paypal':
        return Boolean(
          this.config.get<string>('commerce.payment.paypalClientId') &&
            this.config.get<string>('commerce.payment.paypalClientSecret'),
        );

      case 'crypto':
        return this.cryptoProvider.isConfigured();

      default:
        return false;
    }
  }
}
