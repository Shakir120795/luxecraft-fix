import { Module } from '@nestjs/common';
import { CustomRequestsService } from './custom-requests.service';
import { CustomRequestsController } from './custom-requests.controller';

@Module({
  controllers: [CustomRequestsController],
  providers: [CustomRequestsService],
  exports: [CustomRequestsService],
})
export class CustomRequestsModule {}
