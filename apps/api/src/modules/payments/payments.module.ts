import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentsController } from './payments.controller';
import { StripeProvider } from './providers/stripe.provider';
import { RazorpayProvider } from './providers/razorpay.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { CryptoProvider } from './providers/crypto.provider';
import { WebhooksController } from './webhooks.controller';
import { WebhookService } from './webhook.service';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [InventoryModule, OrdersModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, PaymentProviderService, StripeProvider, RazorpayProvider, PayPalProvider, CryptoProvider, WebhookService],
  exports: [PaymentsService, PaymentProviderService, StripeProvider, RazorpayProvider, PayPalProvider, CryptoProvider],
})
export class PaymentsModule {}
