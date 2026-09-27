import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminCouponsService } from './admin-coupons.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRoles } from '../admin-auth/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';
import { AdminRole } from '@prisma/client';

@Controller('admin/coupons')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminCouponsController {
  constructor(private readonly svc: AdminCouponsService) {}

  @Get()
  findAll(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.svc.findAll({ skip, take });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post()
  create(@Body() body: {
    code: string;
    discountType: string;
    discountValue: number;
    validFrom: string;
    validTo?: string;
    minOrderAmount?: number;
    maxUsageCount?: number;
    maxPerCustomer?: number;
    showOnHome?: boolean;
  }) {
    return this.svc.create({
      ...body,
      validFrom: new Date(body.validFrom),
      validTo: body.validTo ? new Date(body.validTo) : undefined,
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.update(id, body);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.svc.deactivate(id);
  }
}
