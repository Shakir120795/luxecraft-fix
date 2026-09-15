import { Module } from '@nestjs/common';
import { AdminCmsService } from './admin-cms.service';
import { AdminCmsController } from './admin-cms.controller';
import { StorefrontFaqController } from './storefront-faq.controller';

@Module({
  controllers: [AdminCmsController, StorefrontFaqController],
  providers: [AdminCmsService],
  exports: [AdminCmsService],
})
export class AdminCmsModule {}
