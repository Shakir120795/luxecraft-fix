import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';

@Controller('admin/dashboard')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminDashboardController {
  constructor(private readonly svc: AdminDashboardService) {}

  @Get('stats')
  getTodayStats() {
    return this.svc.getTodayStats();
  }

  @Get('recent-orders')
  getRecentOrders() {
    return this.svc.getRecentOrders();
  }

  @Get('top-products')
  getTopProducts() {
    return this.svc.getTopProducts();
  }

  @Get('order-stats')
  getOrderStats() {
    return this.svc.getOrderStats();
  }
}
