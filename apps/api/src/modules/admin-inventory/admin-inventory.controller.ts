import { Controller, Get, Param, Post, Query, UseGuards, Body } from '@nestjs/common';
import { AdminInventoryService } from './admin-inventory.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';

@Controller('admin/inventory')
@UseGuards(AdminJwtAuthGuard)
export class AdminInventoryController {
  constructor(private readonly svc: AdminInventoryService) {}

  @Get('low-stock')
  getLowStockVariants(@Query('threshold') threshold: number = 10) {
    return this.svc.getLowStockVariants(threshold);
  }

  @Get(':variantId/history')
  getInventoryHistory(@Param('variantId') variantId: string, @Query('limit') limit: number = 50) {
    return this.svc.getInventoryHistory(variantId, limit);
  }

  @Post(':variantId/adjust')
  adjustInventory(@Param('variantId') variantId: string, @Body() data: { delta: number; reason: string }) {
    return this.svc.adjustInventory(variantId, data.delta, data.reason);
  }
}
