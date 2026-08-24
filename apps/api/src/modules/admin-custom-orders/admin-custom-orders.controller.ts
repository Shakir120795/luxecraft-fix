import { Controller, Get, Param, Patch, Query, UseGuards, Body } from '@nestjs/common';
import { AdminCustomOrdersService } from './admin-custom-orders.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';

@Controller('admin/custom-orders')
@UseGuards(AdminJwtAuthGuard)
export class AdminCustomOrdersController {
  constructor(private readonly svc: AdminCustomOrdersService) {}

  @Get('requests')
  findAllRequests(@Query('status') status?: string, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.svc.findAllRequests({ status, skip, take });
  }

  @Get('requests/:id')
  getRequestDetail(@Param('id') id: string) {
    return this.svc.getRequestDetail(id);
  }

  @Patch('requests/:id/status')
  updateRequestStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.svc.updateRequestStatus(id, data.status);
  }
}
