import { Module } from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service';

@Module({
  providers: [AdminNotificationsService],
  exports: [AdminNotificationsService],
})
export class AdminNotificationsModule {}
