import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController, AdminShippingController } from './shipping.controller';

@Module({
  controllers: [ShippingController, AdminShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}