import { Controller, Get, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('storefront/pages')
export class StorefrontPagesController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getPages() {
    return this.settings.getSitePages();
  }

  @Get('product-filters')
  getProductFilters() {
    return this.settings.getProductFilters();
  }

  @Get(':slug')
  getPage(@Param('slug') slug: string) {
    return this.settings.getSitePage(slug);
  }
}
