import { registerAs } from '@nestjs/config';

const csv = (value: string | undefined, fallback: string[] = []) =>
  value?.split(',').map((item) => item.trim()).filter(Boolean) ?? fallback;

export default registerAs('commerce', () => ({
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? 'USD',
  supportedCurrencies: csv(process.env.SUPPORTED_CURRENCIES, ['USD']),
  supportedCountries: csv(process.env.SUPPORTED_COUNTRIES),
  payment: {
    provider: (process.env.PAYMENT_PROVIDER ?? 'none').toLowerCase(),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    paypalBaseUrl: process.env.PAYPAL_BASE_URL ?? 'https://api-m.sandbox.paypal.com',
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER ?? 'none').toLowerCase(),
    from: process.env.EMAIL_FROM,
    fromName: process.env.EMAIL_FROM_NAME ?? 'LuxeCraft',
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
