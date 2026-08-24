import { Module } from '@nestjs/common';
import { AdminCustomOrdersService } from './admin-custom-orders.service';
import { AdminCustomOrdersController } from './admin-custom-orders.controller';

@Module({
  controllers: [AdminCustomOrdersController],
  providers: [AdminCustomOrdersService],
  exports: [AdminCustomOrdersService],
})
export class AdminCustomOrdersModule {}
