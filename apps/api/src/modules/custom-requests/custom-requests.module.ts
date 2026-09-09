import { Module } from '@nestjs/common';
import { CustomRequestsService } from './custom-requests.service';
import { CustomRequestsController } from './custom-requests.controller';
import { CustomMessagesModule } from '../custom-messages/custom-messages.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [CustomMessagesModule, UploadsModule],
  controllers: [CustomRequestsController],
  providers: [CustomRequestsService],
  exports: [CustomRequestsService],
})
export class CustomRequestsModule {}
