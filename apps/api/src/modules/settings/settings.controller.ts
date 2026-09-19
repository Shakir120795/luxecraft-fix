import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('currency')
  getCurrency() {
    return this.settings.getDefaultCurrency();
  }

  @Put('currency')
  updateCurrency(@Body() data: { currency: string }) {
    return this.settings.updateDefaultCurrency(data.currency);
  }

  @Get('pages')
  getSitePages() {
    return this.settings.getSitePages();
  }

  @Get('product-filters')
  getProductFilters() {
    return this.settings.getProductFilters();
  }

  @Put('product-filters')
  updateProductFilters(@Body() data: any[]) {
    return this.settings.updateProductFilters(data);
  }

  @Put('pages/:slug')
  updateSitePage(
    @Param('slug') slug: string,
    @Body() data: { title?: string; lastUpdated?: string; content?: string },
  ) {
    return this.settings.updateSitePage(slug, data);
  }
}
