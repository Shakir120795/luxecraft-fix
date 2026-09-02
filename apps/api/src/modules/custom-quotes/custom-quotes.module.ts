import { Module } from '@nestjs/common';
import { CustomQuotesService } from './custom-quotes.service';
import { CustomQuotesController } from './custom-quotes.controller';
import { CustomRequestsModule } from '../custom-requests/custom-requests.module';

@Module({
  imports: [CustomRequestsModule],
  controllers: [CustomQuotesController],
  providers: [CustomQuotesService],
  exports: [CustomQuotesService],
})
export class CustomQuotesModule {}
