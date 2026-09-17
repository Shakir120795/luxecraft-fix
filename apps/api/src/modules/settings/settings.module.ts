import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { StorefrontPagesController } from './storefront-pages.controller';

@Module({
  controllers: [SettingsController, StorefrontPagesController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
