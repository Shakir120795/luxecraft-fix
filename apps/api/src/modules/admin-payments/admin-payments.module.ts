import { Module } from '@nestjs/common';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminPaymentsController } from './admin-payments.controller';

@Module({
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsService],
  exports: [AdminPaymentsService],
})
export class AdminPaymentsModule {}
