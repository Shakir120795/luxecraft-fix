import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ShippingModule } from '../shipping/shipping.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [ShippingModule, CurrencyModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

