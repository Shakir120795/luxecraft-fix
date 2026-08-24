import { Module } from '@nestjs/common';
import { AdminCustomersService } from './admin-customers.service';
import { AdminCustomersController } from './admin-customers.controller';

@Module({
  controllers: [AdminCustomersController],
  providers: [AdminCustomersService],
  exports: [AdminCustomersService],
})
export class AdminCustomersModule {}
