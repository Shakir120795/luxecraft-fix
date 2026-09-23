import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PaymentProviderStatus = {
  provider: string;
  providers: string[];
  configured: boolean;
  currencySupported: boolean;
  publicKey?: string;
  cryptoNetworks?: string[];
  cryptoSupportedAssets?: string[];
};

/** Safe provider metadata for checkout; credentials never leave the API. */
@Injectable()
export class PaymentProviderService {
  constructor(private readonly config: ConfigService) {}

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

    const cryptoNetworks = this.config.get<string[]>(
      'commerce.payment.cryptoNetworks',
      [],
    );

    const cryptoSupportedAssets = this.config.get<string[]>(
      'commerce.payment.cryptoSupportedAssets',
      [],
    );

    return {
      provider: configuredProvider,
      providers,
      configured: this.isConfigured(configuredProvider),
      currencySupported: currencies.includes(currency.toUpperCase()),
      ...(publicKey ? { publicKey } : {}),
      ...(providers.includes('crypto')
        ? { cryptoNetworks, cryptoSupportedAssets }
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

      case 'crypto': {
        const enabled = String(
          this.config.get('commerce.payment.cryptoEnabled') ?? 'false',
        ).toLowerCase() === 'true';

        const networks = this.config.get<string[]>(
          'commerce.payment.cryptoNetworks',
          [],
        );

        const assets = this.config.get<string[]>(
          'commerce.payment.cryptoSupportedAssets',
          [],
        );

        const wallets =
          this.config.get<Record<string, string>>(
            'commerce.payment.cryptoWallets',
            {},
          ) || {};

        return (
          enabled &&
          networks.length > 0 &&
          assets.length > 0 &&
          Object.values(wallets).some(Boolean)
        );
      }

      default:
        return false;
    }
  }
}
