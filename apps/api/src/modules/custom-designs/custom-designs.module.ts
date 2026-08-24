import { Module } from '@nestjs/common';
import { CustomDesignsService } from './custom-designs.service';

@Module({
  providers: [CustomDesignsService],
  exports: [CustomDesignsService],
})
export class CustomDesignsModule {}
