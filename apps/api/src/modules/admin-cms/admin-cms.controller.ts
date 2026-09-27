import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AdminCmsService } from './admin-cms.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRoles } from '../admin-auth/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';
import { AdminRole } from '@prisma/client';

@Controller('admin/cms')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminCmsController {
  constructor(private readonly cms: AdminCmsService) {}

  @Get('faqs')
  getFaqs() {
    return this.cms.getFaqs();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post('faqs')
  createFaq(@Body() data: {
    category: string;
    question: string;
    answer: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.cms.createFaq(data);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Put('faqs/:id')
  updateFaq(
    @Param('id') id: string,
    @Body() data: {
      category?: string;
      question?: string;
      answer?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.cms.updateFaq(id, data);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Delete('faqs/:id')
  deleteFaq(@Param('id') id: string) {
    return this.cms.deleteFaq(id);
  }
  @Get('hero')
  getHero() {
    return this.cms.getHero();
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
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
