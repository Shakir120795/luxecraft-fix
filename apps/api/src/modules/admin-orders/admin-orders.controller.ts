import { Controller, Get, Param, Patch, Post, Query, UseGuards, Body } from '@nestjs/common';
import { AdminOrdersService } from './admin-orders.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRoles } from '../admin-auth/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';
import { AdminRole } from '@prisma/client';
import { UpdateAdminOrderStatusDto } from './dto/update-admin-order-status.dto';
import { ProcessAdminRefundDto } from './dto/process-admin-refund.dto';

@Controller('admin/orders')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminOrdersController {
  constructor(private readonly svc: AdminOrdersService) {}

  @Get()
  findAll(
    @Query('orderStatus') orderStatus?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.svc.findAll({ orderStatus, paymentStatus, search, skip, take });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: UpdateAdminOrderStatusDto) {
    return this.svc.updateStatus(id, data.orderStatus, data.fulfillmentStatus);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post(':id/cancel')
  cancelOrder(@Param('id') id: string) {
    return this.svc.cancelOrder(id);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post(':id/refund')
  processRefund(@Param('id') id: string, @Body() data: ProcessAdminRefundDto) {
    return this.svc.processRefund(id, data);
  }
}
