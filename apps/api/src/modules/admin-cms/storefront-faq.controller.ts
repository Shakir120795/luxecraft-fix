import { Controller, Get } from '@nestjs/common';
import { AdminCmsService } from './admin-cms.service';

@Controller('storefront/faq')
export class StorefrontFaqController {
  constructor(private readonly cms: AdminCmsService) {}

  @Get()
  getFaqs() {
    return this.cms.getActiveFaqs();
  }
}