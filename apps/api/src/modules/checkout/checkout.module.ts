import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CartModule } from '../cart/cart.module';
import { AddressesModule } from '../addresses/addresses.module';
import { ShippingModule } from '../shipping/shipping.module';
import { TaxModule } from '../tax/tax.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomRequestsModule } from '../custom-requests/custom-requests.module';
import { CustomDesignsModule } from '../custom-designs/custom-designs.module';

@Module({
  controllers: [CheckoutController],
  imports: [
    CartModule,
    AddressesModule,
    ShippingModule,
    TaxModule,
    OrdersModule,
    PaymentsModule,
    InventoryModule,
    CustomRequestsModule,
    CustomDesignsModule,
  ],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
