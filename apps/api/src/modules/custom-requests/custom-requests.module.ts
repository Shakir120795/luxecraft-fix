import { Module } from '@nestjs/common';
import { CustomRequestsService } from './custom-requests.service';
import { CustomRequestsController } from './custom-requests.controller';
import { CustomMessagesModule } from '../custom-messages/custom-messages.module';
import { UploadsModule } from '../uploads/uploads.module';
import { AdminNotificationsModule } from '../admin-notifications/admin-notifications.module';

@Module({
  imports: [CustomMessagesModule, UploadsModule, AdminNotificationsModule],
  controllers: [CustomRequestsController],
  providers: [CustomRequestsService],
  exports: [CustomRequestsService],
})
export class CustomRequestsModule {}
