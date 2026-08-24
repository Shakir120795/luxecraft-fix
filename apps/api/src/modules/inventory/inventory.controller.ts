import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminUser, InventoryChange } from '@prisma/client';

@Controller('admin/inventory')
@UseGuards(AdminJwtAuthGuard)
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  adjust(@Body() dto: AdjustInventoryDto, @CurrentAdmin() admin: AdminUser) {
    return this.svc.adjust(dto, admin.id);
  }

  @Get('low-stock')
  findLowStock() {
    return this.svc.findLowStock();
  }

  @Get('logs')
  findLogs(
    @Query('productId') productId?: string,
    @Query('variantId') variantId?: string,
    @Query('changeType') changeType?: InventoryChange,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.svc.findLogs({ productId, variantId, changeType, skip, take });
  }
}
