import { registerAs } from '@nestjs/config';

const csv = (value: string | undefined, fallback: string[] = []) =>
  value?.split(',').map((item) => item.trim()).filter(Boolean) ?? fallback;

export default registerAs('commerce', () => ({
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? 'USD',
  supportedCurrencies: csv(process.env.SUPPORTED_CURRENCIES, ['USD','INR','CAD','GBP','AUD','AED','EUR','JPY','SGD','NZD','CHF','CNY']),
  supportedCountries: csv(process.env.SUPPORTED_COUNTRIES),
  payment: {
    provider: (process.env.PAYMENT_PROVIDER ?? 'none').toLowerCase(),
    providers: csv(process.env.PAYMENT_PROVIDERS),
    stripeSecretKey: process.env.PAYMENT_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.PAYMENT_PUBLIC_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID,
    paypalBaseUrl: process.env.PAYPAL_BASE_URL ?? 'https://api-m.sandbox.paypal.com',
    cryptoEnabled: (process.env.CRYPTO_ENABLED ?? 'false').toLowerCase() === 'true',
    cryptoNetworks: csv(process.env.CRYPTO_NETWORKS),
    cryptoSupportedAssets: csv(process.env.CRYPTO_SUPPORTED_ASSETS),
    cryptoRpc: {
      ethereum: process.env.CRYPTO_ETHEREUM_RPC ?? 'https://cloudflare-eth.com/v1/mainnet',
      solana: process.env.CRYPTO_SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com',
      tron: process.env.CRYPTO_TRON_RPC ?? 'https://api.trongrid.io',
      tronApiKey: process.env.CRYPTO_TRONGRID_API_KEY,
    },
    cryptoTokens: {
      ethereumUsdt: process.env.CRYPTO_ETHEREUM_USDT_TOKEN ?? '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      ethereumUsdc: process.env.CRYPTO_ETHEREUM_USDC_TOKEN ?? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      solanaUsdt: process.env.CRYPTO_SOLANA_USDT_TOKEN ?? 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      solanaUsdc: process.env.CRYPTO_SOLANA_USDC_TOKEN ?? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tronUsdt: process.env.CRYPTO_TRON_USDT_TOKEN ?? 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      tronUsdc: process.env.CRYPTO_TRON_USDC_TOKEN ?? '',
    },
    cryptoWallets: {
      ethereumUsdt: process.env.CRYPTO_ETHEREUM_USDT_ADDRESS,
      ethereumUsdc: process.env.CRYPTO_ETHEREUM_USDC_ADDRESS,
      solanaUsdt: process.env.CRYPTO_SOLANA_USDT_ADDRESS,
      solanaUsdc: process.env.CRYPTO_SOLANA_USDC_ADDRESS,
      tronUsdt: process.env.CRYPTO_TRON_USDT_ADDRESS,
      tronUsdc: process.env.CRYPTO_TRON_USDC_ADDRESS,
    },
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER ?? 'none').toLowerCase(),
    from: process.env.EMAIL_FROM,
    fromName: process.env.EMAIL_FROM_NAME ?? 'Wolhomes',
    resendApiKey: process.env.RESEND_API_KEY,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  },
  storage: {
    provider: (process.env.STORAGE_PROVIDER ?? 'local').toLowerCase(),
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION,
    bucketPublic: process.env.STORAGE_BUCKET_PUBLIC,
    bucketPrivate: process.env.STORAGE_BUCKET_PRIVATE,
    cdnUrl: process.env.STORAGE_CDN_URL,
  },
}));



