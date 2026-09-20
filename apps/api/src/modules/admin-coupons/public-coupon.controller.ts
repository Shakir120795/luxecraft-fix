import { Controller, Get } from '@nestjs/common';
import { AdminCouponsService } from './admin-coupons.service';

@Controller('storefront/coupon-label')
export class PublicCouponController {
  constructor(private readonly svc: AdminCouponsService) {}

  @Get()
  async getHomeCoupon() {
    return {
      success: true,
      data: await this.svc.getHomeCoupon(),
    };
  }
}
