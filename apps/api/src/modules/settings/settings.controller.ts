import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';

import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRoles } from '../admin-auth/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';
import { AdminRole } from '@prisma/client';

import { SettingsService } from './settings.service';

@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('currency')
  getCurrency() {
    return this.settings.getDefaultCurrency();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Put('currency')
  updateCurrency(@Body() data: { currency: string }) {
    return this.settings.updateDefaultCurrency(data.currency);
  }

  @Get('pages')
  getSitePages() {
    return this.settings.getSitePages();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Put('pages/:slug')
  updateSitePage(
    @Param('slug') slug: string,
    @Body() data: { title?: string; lastUpdated?: string; content?: string },
  ) {
    return this.settings.updateSitePage(slug, data);
  }

  @Get('product-filters')
  getProductFilters() {
    return this.settings.getProductFilters();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Put('product-filters')
  updateProductFilters(@Body() data: any[]) {
    return this.settings.updateProductFilters(data);
  }

  @Get('homepage-videos')
  getHomepageVideos() {
    return this.settings.getHomepageVideos();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Put('homepage-videos')
  updateHomepageVideos(@Body() data: any[]) {
    return this.settings.updateHomepageVideos(data);
  }
}