import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoProvider, CryptoPaymentOption } from './providers/crypto.provider';
import { PayPalProvider } from './providers/paypal.provider';

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
    private readonly paypalProvider: PayPalProvider,
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

    const currencyCode = currency.toUpperCase();
    const providers = Array.from(new Set(
      configuredProviders
        .map((candidate) => candidate.toLowerCase())
        .filter((candidate) =>
          this.isConfigured(candidate) &&
          this.isCurrencySupported(candidate, currencyCode) &&
          (candidate !== 'crypto' || currencyCode === 'USD'),
        ),
    ));

    const configuredProviderSupported =
      this.isConfigured(configuredProvider) &&
      this.isCurrencySupported(configuredProvider, currencyCode);
    const effectiveProvider = configuredProviderSupported
      ? configuredProvider
      : providers[0] || configuredProvider;
    const effectiveProviderConfigured =
      this.isConfigured(effectiveProvider) &&
      this.isCurrencySupported(effectiveProvider, currencyCode);

    const publicKey = this.publicKeyFor(effectiveProvider);

    const cryptoPaymentOptions = this.cryptoProvider.getConfiguredPaymentOptions();
    const cryptoNetworks = Array.from(
      new Set(cryptoPaymentOptions.map((option) => option.network)),
    );
    const cryptoSupportedAssets = Array.from(
      new Set(cryptoPaymentOptions.map((option) => option.asset)),
    );

    return {
      provider: effectiveProvider,
      providers,
      configured: effectiveProviderConfigured,
      currencySupported: currencies.includes(currencyCode),
      ...(publicKey ? { publicKey } : {}),
      ...(cryptoPaymentOptions.length > 0
        ? { cryptoNetworks, cryptoSupportedAssets, cryptoPaymentOptions }
        : {}),
    };
  }

  publicKeyFor(provider: string): string | undefined {
    switch (provider.toLowerCase()) {
      case 'razorpay':
        return this.config.get<string>('commerce.payment.razorpayKeyId');
      case 'paypal':
        return this.config.get<string>('commerce.payment.paypalClientId');
      default:
        return undefined;
    }
  }

  private isCurrencySupported(provider: string, currency: string): boolean {
    switch (provider.toLowerCase()) {
      case 'paypal':
        return this.paypalProvider.isCurrencySupported(currency);
      case 'crypto':
        return currency === 'USD';
      default:
        return true;
    }
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
