import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AdminCmsService } from './admin-cms.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';

@Controller('admin/cms')
@UseGuards(AdminJwtAuthGuard)
export class AdminCmsController {
  constructor(private readonly cms: AdminCmsService) {}

  @Get('hero')
  getHero() {
    return this.cms.getHero();
  }

  @Put('hero')
  updateHero(@Body() data: {
    productId?: string | null;
    imageUrl?: string | null;
    eyebrow?: string | null;
    title: string;
    subtitle?: string | null;
    primaryCtaText?: string | null;
    primaryCtaLink?: string | null;
    secondaryCtaText?: string | null;
    secondaryCtaLink?: string | null;
    isActive?: boolean;
  }) {
    return this.cms.updateHero(data);
  }
}
