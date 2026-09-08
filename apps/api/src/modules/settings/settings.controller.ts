import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('currency')
  getCurrency() {
    return this.settings.getDefaultCurrency();
  }

  @Put('currency')
  updateCurrency(@Body() data: { currency: string }) {
    return this.settings.updateDefaultCurrency(data.currency);
  }
}
