import { Controller, Get, Param, Patch, Post, Query, UseGuards, Body } from '@nestjs/common';
import { AdminOrdersService } from './admin-orders.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';

@Controller('admin/orders')
@UseGuards(AdminJwtAuthGuard)
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
  updateStatus(@Param('id') id: string, @Body() data: { orderStatus?: string; paymentStatus?: string; fulfillmentStatus?: string }) {
    return this.svc.updateStatus(id, data.orderStatus, data.paymentStatus, data.fulfillmentStatus);
  }

  @Post(':id/cancel')
  cancelOrder(@Param('id') id: string) {
    return this.svc.cancelOrder(id);
  }

  @Post(':id/refund')
  processRefund(@Param('id') id: string, @Body() data: { refundAmount: number }) {
    return this.svc.processRefund(id, data.refundAmount);
  }
}
