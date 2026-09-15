import { Module } from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service';
import { TelegramService } from './telegram.service';
import { CustomerNotificationsController } from './admin-notifications.controller';

@Module({
  controllers: [CustomerNotificationsController],
  providers: [AdminNotificationsService, TelegramService],
  exports: [AdminNotificationsService, TelegramService],
})
export class AdminNotificationsModule {}

