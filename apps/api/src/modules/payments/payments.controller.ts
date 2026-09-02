import { Controller, Get, Query } from '@nestjs/common';
import { PaymentProviderService } from './payment-provider.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly providers: PaymentProviderService) {}

  /**
   * Get payment provider configuration (safe for frontend)
   * Returns: provider name, configured status, currency support, publishable key
   * Endpoint: GET /api/v1/payments/configuration?currency=USD
   */
  @Public()
  @Get('configuration')
  configuration(@Query('currency') currency = 'USD') {
    return this.providers.status(currency);
  }
}
