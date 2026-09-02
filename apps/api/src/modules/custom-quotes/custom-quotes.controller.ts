import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomRequestsService } from '../custom-requests/custom-requests.service';
import { CustomQuotesService } from './custom-quotes.service';

/** Customer actions for a quote.  Ownership is checked through its request. */
@Controller('custom-quotes')
@UseGuards(JwtAuthGuard)
export class CustomQuotesController {
  constructor(
    private readonly quotes: CustomQuotesService,
    private readonly requests: CustomRequestsService,
  ) {}

  @Post(':id/accept')
  async accept(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    await this.assertOwner(id, user.id);
    return this.quotes.customerAcceptQuote(id);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    await this.assertOwner(id, user.id);
    return this.quotes.customerRejectQuote(id);
  }

  @Post(':id/request-revision')
  async requestRevision(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    await this.assertOwner(id, user.id);
    return this.quotes.customerRequestRevision(id);
  }

  private async assertOwner(quoteId: string, userId: string) {
    const quote = await this.quotes.findOne(quoteId);
    await this.requests.findOneForUser(quote.customRequestId, userId);
  }
}
