import { Module } from '@nestjs/common';
import { AdminCmsService } from './admin-cms.service';

@Module({
  providers: [AdminCmsService],
  exports: [AdminCmsService],
})
export class AdminCmsModule {}
