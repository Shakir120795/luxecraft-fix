import { Module } from '@nestjs/common';
import { AdminCmsService } from './admin-cms.service';
import { AdminCmsController } from './admin-cms.controller';

@Module({
  controllers: [AdminCmsController],
  providers: [AdminCmsService],
  exports: [AdminCmsService],
})
export class AdminCmsModule {}
