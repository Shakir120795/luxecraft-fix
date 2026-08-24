import { Controller, Get, Param, Patch, Query, UseGuards, Body } from '@nestjs/common';
import { AdminCustomersService } from './admin-customers.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';

@Controller('admin/customers')
@UseGuards(AdminJwtAuthGuard)
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

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.svc.updateStatus(id, data.status);
  }
}
