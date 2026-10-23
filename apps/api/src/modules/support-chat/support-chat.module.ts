import { Module } from '@nestjs/common';
import { SupportChatController } from './support-chat.controller';
import { AdminSupportChatController } from './admin-support-chat.controller';
import { SupportChatService } from './support-chat.service';
import { AdminNotificationsModule } from '../admin-notifications/admin-notifications.module';

@Module({
  imports: [AdminNotificationsModule],
  controllers: [SupportChatController, AdminSupportChatController],
  providers: [SupportChatService],
})
export class SupportChatModule {}
