import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type RateCacheEntry = {
  rate: number;
  expiresAt: number;
};

const COUNTRY_CURRENCY: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  AU: 'AUD',
  AE: 'AED',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  JP: 'JPY',
  SG: 'SGD',
  NZ: 'NZD',
  CH: 'CHF',
  CN: 'CNY',
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly cache = new Map<string, RateCacheEntry>();

  constructor(private readonly config: ConfigService) {}

  getDefaultCurrency(): string {
    return (
      this.config.get<string>('commerce.defaultCurrency', 'USD')?.toUpperCase() ||
      'USD'
    );
  }

  getCurrencyForCountry(country: string): string {
    return COUNTRY_CURRENCY[country.trim().toUpperCase()] ?? this.getDefaultCurrency();
  }

  async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const from = fromCurrency.trim().toUpperCase();
    const to = toCurrency.trim().toUpperCase();

    if (from === to) return 1;

    const cacheKey = `${from}:${to}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.rate;
    }

    try {
      const response = await fetch(
        `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
      );

      if (!response.ok) {
        throw new Error(`Frankfurter returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        rate?: number;
      };

      if (!data.rate || !Number.isFinite(data.rate) || data.rate <= 0) {
        throw new Error('Invalid exchange rate received');
      }

      this.cache.set(cacheKey, {
        rate: data.rate,
        expiresAt: Date.now() + 60 * 60 * 1000,
      });

      return data.rate;
    } catch (error) {
      this.logger.error(
        `Failed to fetch exchange rate ${from}/${to}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException(
        `Exchange rate unavailable for ${from} to ${to}. Please try again.`,
      );
    }
  }

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (!Number.isFinite(amount)) {
      throw new BadRequestException('Invalid amount for currency conversion.');
    }

    const rate = await this.getRate(fromCurrency, toCurrency);
    return Math.round(amount * rate * 100) / 100;
  }
}
