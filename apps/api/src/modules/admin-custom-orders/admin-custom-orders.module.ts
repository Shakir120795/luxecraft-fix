import { Module } from '@nestjs/common';
import { AdminCustomOrdersService } from './admin-custom-orders.service';
import { AdminCustomOrdersController } from './admin-custom-orders.controller';
import { CustomQuotesModule } from '../custom-quotes/custom-quotes.module';
import { CustomMessagesModule } from '../custom-messages/custom-messages.module';

@Module({
  imports: [CustomQuotesModule, CustomMessagesModule],
  controllers: [AdminCustomOrdersController],
  providers: [AdminCustomOrdersService],
  exports: [AdminCustomOrdersService],
})
export class AdminCustomOrdersModule {}
