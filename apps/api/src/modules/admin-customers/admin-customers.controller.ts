import { Controller, Get, Param, Patch, Query, UseGuards, Body, Delete } from '@nestjs/common';
import { AdminCustomersService } from './admin-customers.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRoles } from '../admin-auth/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';
import { AdminRole } from '@prisma/client';

@Controller('admin/customers')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminCustomersController {
  constructor(private readonly svc: AdminCustomersService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('status') status?: string, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.svc.findAll({ search, status, skip, take });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Delete(':id')
  deleteCustomer(@Param('id') id: string) {
    return this.svc.deleteUnverified(id);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.svc.updateStatus(id, data.status);
  }
}

