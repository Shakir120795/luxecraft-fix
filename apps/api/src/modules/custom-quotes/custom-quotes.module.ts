import { Module } from '@nestjs/common';
import { CustomQuotesService } from './custom-quotes.service';
import { CustomQuotesController } from './custom-quotes.controller';
import { CustomRequestsModule } from '../custom-requests/custom-requests.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [CustomRequestsModule, PaymentsModule],
  controllers: [CustomQuotesController],
  providers: [CustomQuotesService],
  exports: [CustomQuotesService],
})
export class CustomQuotesModule {}
