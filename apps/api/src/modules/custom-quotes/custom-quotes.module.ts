import { Module } from '@nestjs/common';
import { CustomQuotesService } from './custom-quotes.service';

@Module({
  providers: [CustomQuotesService],
  exports: [CustomQuotesService],
})
export class CustomQuotesModule {}
