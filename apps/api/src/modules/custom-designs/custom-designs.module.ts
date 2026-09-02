import { Module } from '@nestjs/common';
import { CustomDesignsService } from './custom-designs.service';
import { CustomDesignsController } from './custom-designs.controller';
import { CustomRequestsModule } from '../custom-requests/custom-requests.module';

@Module({
  imports: [CustomRequestsModule],
  controllers: [CustomDesignsController],
  providers: [CustomDesignsService],
  exports: [CustomDesignsService],
})
export class CustomDesignsModule {}
