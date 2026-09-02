import { Module } from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service';
import { CustomerNotificationsController } from './admin-notifications.controller';

@Module({
  controllers: [CustomerNotificationsController],
  providers: [AdminNotificationsService],
  exports: [AdminNotificationsService],
})
export class AdminNotificationsModule {}
