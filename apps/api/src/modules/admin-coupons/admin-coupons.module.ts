import { Module } from '@nestjs/common';
import { AdminCouponsService } from './admin-coupons.service';
import { AdminCouponsController } from './admin-coupons.controller';
import { PublicCouponController } from './public-coupon.controller';

@Module({
  controllers: [AdminCouponsController, PublicCouponController],
  providers: [AdminCouponsService],
  exports: [AdminCouponsService],
})
export class AdminCouponsModule {}
