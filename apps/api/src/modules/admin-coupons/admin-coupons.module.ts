import { Module } from '@nestjs/common';
import { AdminCouponsService } from './admin-coupons.service';

@Module({
  providers: [AdminCouponsService],
  exports: [AdminCouponsService],
})
export class AdminCouponsModule {}
