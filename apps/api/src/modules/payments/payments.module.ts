import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentsController } from './payments.controller';
import { StripeProvider } from './providers/stripe.provider';
import { WebhooksController } from './webhooks.controller';
import { WebhookService } from './webhook.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, PaymentProviderService, StripeProvider, WebhookService],
  exports: [PaymentsService, PaymentProviderService, StripeProvider],
})
export class PaymentsModule {}
