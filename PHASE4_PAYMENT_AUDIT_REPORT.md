# PHASE 4: Payment Implementation Audit

**Date**: ${new Date().toISOString()}  
**Status**: AUDIT COMPLETE - NOT PRODUCTION READY ❗

---

## Executive Summary

**Payment System Status**: 🔴 **0% IMPLEMENTED**

### Critical Finding:
❗❗❗ **NO PAYMENT PROVIDER INTEGRATION EXISTS**

The payment infrastructure (database models, services) is in place, but:
- ❌ No Stripe integration
- ❌ No Razorpay integration
- ❌ No PayPal integration
- ❌ No webhook handling
- ❌ No payment processing
- ❌ Orders stuck in PENDING status forever

**Current Behavior**:
1. Customer completes checkout ✅
2. Order created with `paymentStatus: PENDING` ✅
3. Payment record created with `status: PENDING` ✅
4. **Payment never processed** ❌
5. **Order never fulfilled** ❌

---

## What Exists ✅

### 1. Database Schema ✅
```prisma
model Payment {
  id                String        @id @default(cuid())
  orderId           String
  provider          String                      // ✅ Multi-provider support
  providerPaymentId String?                     // ✅ External payment ID
  amount            Decimal       @db.Decimal(12, 2)
  currency          String        @default("USD")
  status            PaymentStatus @default(PENDING)  // ✅ Status tracking
  paymentMethod     String?
  metadata          Json?                       // ✅ Flexible metadata
  refundedAmount    Decimal       @default(0)   // ✅ Partial refund support
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  paidAt            DateTime?                   // ✅ Timestamp tracking
  failedAt          DateTime?
  refundedAt        DateTime?
  order             Order         @relation(...)
}

enum PaymentStatus {
  PENDING
  PROCESSING
  PAID                           // ✅ Success status
  FAILED                         // ✅ Failure status
  REFUNDED                       // ✅ Full refund
  PARTIALLY_REFUNDED             // ✅ Partial refund
  CANCELLED
}
```

**Assessment**: Schema is well-designed and production-ready ✅

---

### 2. PaymentsService ✅
**File**: `apps/api/src/modules/payments/payments.service.ts`

**Methods**:
```typescript
async create(data: {...}): Promise<Payment>
async updateStatus(paymentId: string, status: PaymentStatus, providerPaymentId?: string): Promise<Payment>
async refund(paymentId: string, amount: number): Promise<Payment>
async findByOrder(orderId: string): Promise<Payment[]>
```

**Assessment**: Basic CRUD operations exist ✅
**Missing**: 
- ❌ Actual payment processing
- ❌ Provider API calls
- ❌ Webhook handling
- ❌ Idempotency checks

---

### 3. PaymentProviderService ✅
**File**: `apps/api/src/modules/payments/payment-provider.service.ts`

**Purpose**: Check if payment provider is configured

**Code**:
```typescript
status(currency: string): PaymentProviderStatus {
  const provider = this.config.get<string>('commerce.payment.provider', 'none');
  // ...
  return {
    provider,
    configured: this.isConfigured(provider),
    currencySupported: currencies.includes(currency.toUpperCase()),
  };
}

private isConfigured(provider: string): boolean {
  switch (provider) {
    case 'stripe': return Boolean(this.config.get('commerce.payment.stripeSecretKey'));
    case 'razorpay': return Boolean(this.config.get('commerce.payment.razorpayKeyId') && ...);
    case 'paypal': return Boolean(this.config.get('commerce.payment.paypalClientId') && ...);
    default: return false;  // ❌ Current state
  }
}
```

**Current Config** (from `.env.example`):
```env
PAYMENT_PROVIDER=none  # ❌ NOT CONFIGURED
```

**Assessment**: Infrastructure ready, but no provider configured ⚠️

---

### 4. Checkout Flow ✅
**File**: `apps/api/src/modules/checkout/checkout.service.ts`

**Current Flow**:
```typescript
async createStandardOrder(...): Promise<any> {
  // 1. Validate cart ✅
  // 2. Calculate totals (server-side) ✅
  // 3. Create order ✅
  // 4. Create payment record:
  const payment = await this.payments.create({
    orderId: order.id,
    provider: 'pending',        // ❌ Hardcoded!
    amount: total,
    currency: cart.currency,
  });
  // 5. Clear cart ✅
  // 6. Return order + payment ✅
  
  // ❌ MISSING: Actual payment processing!
}
```

**Problem**: Order is created but payment is never processed!

---

## What's Missing ❌

### 1. Payment Provider Integration ❗❗❗

**NO integration exists for**:
- Stripe
- Razorpay
- PayPal
- Any other provider

**What needs to be built**:
```typescript
// Example: Stripe integration
class StripePaymentProvider {
  async createPaymentIntent(amount: number, currency: string, orderId: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,  // Stripe uses cents
      currency,
      metadata: { orderId },
    });
    return paymentIntent.client_secret;
  }
  
  async confirmPayment(paymentIntentId: string) {
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }
}
```

---

### 2. Webhook Endpoints ❗❗❗

**NO webhook handlers exist**

**Required webhooks** (example for Stripe):
- `payment_intent.succeeded` → Mark order as PAID
- `payment_intent.payment_failed` → Mark order as FAILED
- `charge.refunded` → Update refund amount
- `payment_intent.canceled` → Cancel order

**What needs to be built**:
```typescript
@Controller('webhooks')
export class WebhooksController {
  @Post('stripe')
  async handleStripeWebhook(@Body() body, @Headers('stripe-signature') signature) {
    // 1. Verify signature ✅ (CRITICAL for security)
    // 2. Handle event type
    // 3. Update payment status
    // 4. Update order status
    // 5. Decrement inventory (if paid)
    // 6. Send confirmation email
  }
}
```

---

### 3. Signature Verification ❗❗

**NO webhook signature verification exists**

**Risk**: Without signature verification, anyone can send fake webhook events to:
- Mark orders as paid without payment
- Trigger refunds
- Cancel orders

**Required implementation**:
```typescript
// Stripe example
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

### 4. Idempotency Handling ❗❗

**NO idempotency checks exist**

**Problem**: Webhooks can be delivered multiple times. Without idempotency:
- Same payment marked as paid 2x
- Stock decremented 2x for same order
- Double email notifications

**Required**:
```prisma
model WebhookEvent {
  id           String   @id @default(cuid())
  provider     String
  eventId      String   @unique  // Provider's event ID
  eventType    String
  payload      Json
  processed    Boolean  @default(false)
  processedAt  DateTime?
  createdAt    DateTime @default(now())
  
  @@index([provider, eventId])
  @@map("webhook_events")
}
```

**Implementation**:
```typescript
async handleWebhook(eventId: string, eventType: string, payload: any) {
  // Check if already processed
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });
  
  if (existing?.processed) {
    return { status: 'already_processed' };
  }
  
  // Process webhook
  await processPayment(payload);
  
  // Mark as processed
  await prisma.webhookEvent.update({
    where: { eventId },
    data: { processed: true, processedAt: new Date() },
  });
}
```

---

### 5. Payment Flow Integration ❗

**Current**: Payment record created but never updated

**Required**:
1. Frontend receives payment intent client secret
2. Frontend handles payment UI (Stripe Elements, Razorpay Checkout, etc.)
3. Frontend confirms payment
4. Webhook updates payment status
5. Order status updated
6. Inventory decremented (PHASE 3 fix)
7. Confirmation email sent

**Missing**: Steps 1, 2, 4, 5, 6, 7

---

## Provider Comparison

### Option 1: Stripe (Recommended) ✅

**Pros**:
- ✅ International support (190+ countries)
- ✅ Excellent documentation
- ✅ Strong TypeScript support (`stripe` npm package)
- ✅ Built-in fraud detection
- ✅ PCI compliance handled
- ✅ Webhook reliability
- ✅ Supports USD, INR, and 135+ currencies

**Cons**:
- ⚠️ 2.9% + $0.30 per transaction (US)
- ⚠️ Higher fees in India (2.9% + ₹2)

**Implementation Complexity**: Medium

**Code Example**:
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000,  // $50.00
  currency: 'usd',
  metadata: { orderId: 'ORD-000123' },
});

// Webhook handling
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

---

### Option 2: Razorpay (India-focused) ✅

**Pros**:
- ✅ India-specific (UPI, Netbanking, Cards, Wallets)
- ✅ Lower fees: 2% per transaction
- ✅ INR native
- ✅ Good documentation
- ✅ NPM package available (`razorpay`)

**Cons**:
- ⚠️ Limited international support
- ⚠️ Not ideal for USD/global customers

**Implementation Complexity**: Medium

**Use Case**: If target market is primarily India

---

### Option 3: PayPal ✅

**Pros**:
- ✅ Recognized brand
- ✅ Global reach
- ✅ Buyer protection

**Cons**:
- ⚠️ Higher fees: 3.49% + fixed fee
- ⚠️ More complex integration
- ⚠️ Disputed transactions common

**Implementation Complexity**: High

**Recommendation**: Only if Stripe/Razorpay not suitable

---

### Option 4: Multiple Providers ✅✅

**Strategy**: Support multiple providers based on currency/region

**Example**:
- USD/International → Stripe
- INR/India → Razorpay

**Implementation**: Already supported by `PaymentProviderService`!

**Code**:
```typescript
function getProvider(currency: string): PaymentProvider {
  if (currency === 'INR') return new RazorpayProvider();
  return new StripeProvider();
}
```

---

## Recommended Implementation (Stripe)

### Step 1: Install Dependencies
```bash
cd apps/api
npm install stripe @types/stripe
```

### Step 2: Environment Variables
```env
# .env.production
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Step 3: Create Stripe Service
**File**: `apps/api/src/modules/payments/providers/stripe.provider.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private readonly stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('commerce.payment.stripeSecretKey');
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured');
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    orderId: string;
    customerId?: string;
  }): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),  // Convert to cents
      currency: params.currency.toLowerCase(),
      metadata: {
        orderId: params.orderId,
      },
      automatic_payment_methods: { enabled: true },
    });
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    
    if (amount) {
      params.amount = Math.round(amount * 100);
    }
    
    return this.stripe.refunds.create(params);
  }

  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>('commerce.payment.stripeWebhookSecret');
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
```

### Step 4: Update Checkout Service
**File**: `apps/api/src/modules/checkout/checkout.service.ts`

```typescript
async createStandardOrder(...): Promise<any> {
  // ... existing order creation code ...
  
  const order = await this.orders.create({...});
  
  // Create Stripe payment intent
  const paymentIntent = await this.stripeProvider.createPaymentIntent({
    amount: total,
    currency: cart.currency,
    orderId: order.id,
  });
  
  // Save payment record
  const payment = await this.payments.create({
    orderId: order.id,
    provider: 'stripe',
    providerPaymentId: paymentIntent.id,  // ✅ Save Stripe ID
    amount: total,
    currency: cart.currency,
    metadata: { clientSecret: paymentIntent.client_secret },
  });
  
  return {
    order,
    payment,
    clientSecret: paymentIntent.client_secret,  // ✅ Return to frontend
  };
}
```

### Step 5: Create Webhook Handler
**File**: `apps/api/src/modules/payments/webhooks.controller.ts`

```typescript
import { Controller, Post, Body, Headers, RawBody, Logger } from '@nestjs/common';
import { StripeProvider } from './providers/stripe.provider';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly stripe: StripeProvider,
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService,
  ) {}

  @Public()
  @Post('stripe')
  async handleStripe(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      // 1. Verify signature
      const event = this.stripe.verifyWebhookSignature(
        rawBody.toString(),
        signature,
      );
      
      this.logger.log(`Webhook received: ${event.type}`);
      
      // 2. Check idempotency
      const existing = await this.prisma.webhookEvent.findUnique({
        where: { eventId: event.id },
      });
      
      if (existing?.processed) {
        return { received: true, status: 'already_processed' };
      }
      
      // 3. Store webhook event
      await this.prisma.webhookEvent.create({
        data: {
          provider: 'stripe',
          eventId: event.id,
          eventType: event.type,
          payload: event.data as any,
        },
      });
      
      // 4. Handle event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
          
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
          
        case 'charge.refunded':
          await this.handleRefund(event.data.object);
          break;
      }
      
      // 5. Mark as processed
      await this.prisma.webhookEvent.update({
        where: { eventId: event.id },
        data: { processed: true, processedAt: new Date() },
      });
      
      return { received: true };
      
    } catch (error) {
      this.logger.error('Webhook error:', error);
      return { received: false, error: error.message };
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const orderId = paymentIntent.metadata.orderId;
    
    // Find payment record
    const payment = await this.payments.findByOrder(orderId);
    
    // Update payment status
    await this.payments.updateStatus(
      payment[0].id,
      PaymentStatus.PAID,
      paymentIntent.id,
    );
    
    // Update order status
    await this.orders.updateStatus(orderId, {
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.CONFIRMED,
    });
    
    // ✅ CRITICAL: Decrement inventory (PHASE 3 implementation)
    await this.inventory.decrementStockForOrder(orderId);
    
    // Send confirmation email
    await this.emailQueue.add('order-confirmation', { orderId });
  }

  private async handlePaymentFailure(paymentIntent: any) {
    const orderId = paymentIntent.metadata.orderId;
    
    const payment = await this.payments.findByOrder(orderId);
    
    await this.payments.updateStatus(
      payment[0].id,
      PaymentStatus.FAILED,
      paymentIntent.id,
    );
    
    await this.orders.updateStatus(orderId, {
      paymentStatus: PaymentStatus.FAILED,
      orderStatus: OrderStatus.CANCELLED,
    });
    
    // Restore stock if reserved
    await this.inventory.restoreStockForOrder(orderId);
  }

  private async handleRefund(charge: any) {
    // Handle refund logic
  }
}
```

### Step 6: Frontend Integration (Storefront)
**File**: `apps/storefront/src/lib/payments/stripe-client.ts`

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export async function confirmPayment(clientSecret: string) {
  const stripe = await stripePromise;
  
  const { error, paymentIntent } = await stripe!.confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/order-confirmation`,
    },
  });
  
  return { error, paymentIntent };
}
```

---

## Testing Requirements

### Development Testing:
1. Use Stripe test mode (`sk_test_...`)
2. Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)
3. Use Stripe CLI for webhook testing:
```bash
stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe
```

### Production Testing:
1. Small real transaction ($0.50)
2. Verify webhook received
3. Verify order updated
4. Verify inventory decremented
5. Verify email sent
6. Test refund flow

---

## Security Checklist

- [ ] ✅ Stripe secret key stored in environment variable (never in code)
- [ ] ✅ Webhook signature verification ALWAYS enabled
- [ ] ✅ Webhook endpoint marked as `@Public()` (no auth)
- [ ] ✅ Idempotency checks prevent duplicate processing
- [ ] ✅ Payment amounts calculated server-side (never trust frontend)
- [ ] ✅ Order totals recalculated before payment
- [ ] ✅ Stock validation before payment
- [ ] ✅ HTTPS required in production
- [ ] ✅ PCI compliance (handled by Stripe)
- [ ] ✅ No payment credentials in logs
- [ ] ✅ Webhook failures logged and alertedundefined

## Production Readiness Checklist

- [ ] Choose payment provider (Stripe recommended)
- [ ] Create Stripe account (or chosen provider)
- [ ] Get API keys (test + production)
- [ ] Install dependencies (`stripe` package)
- [ ] Implement provider service
- [ ] Update checkout service
- [ ] Create webhook controller
- [ ] Add webhook event model to Prisma schema
- [ ] Migrate database
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Test with test cards
- [ ] Frontend: Install `@stripe/stripe-js`
- [ ] Frontend: Add payment UI
- [ ] Test complete flow end-to-end
- [ ] Enable production mode
- [ ] Monitor first transactions
- [ ] Set up webhook failure alerts
- [ ] Document payment flow for team

---

## Current Production Readiness

**Before PHASE 4**: 50% 🟡  
**After PHASE 4 Audit**: 50% 🟡 (no implementation yet)  
**After PHASE 4 Implementation**: Expected 70% 🟢

**Critical Blockers**:
- ❗❗❗ Payment provider integration (MUST IMPLEMENT)
- ❗❗❗ Inventory stock decrement (PHASE 3)
- ❗❗ Webhook handling
- ❗ Security hardening (PHASE 6)

---

## Estimated Implementation Time

- Stripe integration: **4-6 hours**
- Webhook handler: **2-3 hours**
- Frontend payment UI: **3-4 hours**
- Testing: **2-3 hours**
- **Total: 11-16 hours**

---

## Recommendation

**DO NOT DEPLOY TO PRODUCTION without payment integration!**

**Minimum Viable Payment** (for production launch):
1. Stripe integration ✅
2. Payment intent creation ✅
3. Webhook for `payment_intent.succeeded` ✅
4. Idempotency check ✅
5. Inventory decrement on payment success ✅
6. Email confirmation ✅

**Can be added later**:
- Multiple payment methods
- Saved cards
- Refund UI (can be manual in Stripe dashboard initially)
- Partial refunds
- Payment retry logic

---

**End of PHASE 4 Audit**

**Status**: AUDIT COMPLETE - IMPLEMENTATION REQUIRED BEFORE PRODUCTION
