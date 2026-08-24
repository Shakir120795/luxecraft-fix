import { Module } from '@nestjs/common';
import { CustomMessagesService } from './custom-messages.service';

@Module({
  providers: [CustomMessagesService],
  exports: [CustomMessagesService],
})
export class CustomMessagesModule {}
