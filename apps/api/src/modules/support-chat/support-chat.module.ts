import { Module } from '@nestjs/common';
import { SupportChatService } from './support-chat.service';
import { SupportChatController } from './support-chat.controller';
import { AdminSupportChatController } from './admin-support-chat.controller';

@Module({
  controllers: [SupportChatController, AdminSupportChatController],
  providers: [SupportChatService],
  exports: [SupportChatService],
})
export class SupportChatModule {}
