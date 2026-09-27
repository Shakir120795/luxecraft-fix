import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminNotificationsModule } from '../admin-notifications/admin-notifications.module';
import { PendingOrderCleanupService } from './pending-order-cleanup.service';

@Module({
  imports: [AdminNotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PendingOrderCleanupService],
  exports: [OrdersService],
})
export class OrdersModule {}
