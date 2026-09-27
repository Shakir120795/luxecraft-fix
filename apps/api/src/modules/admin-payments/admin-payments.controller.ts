import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';

@Controller('admin/payments')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminPaymentsController {
  constructor(private readonly svc: AdminPaymentsService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.svc.findAll({ status, skip, take });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
