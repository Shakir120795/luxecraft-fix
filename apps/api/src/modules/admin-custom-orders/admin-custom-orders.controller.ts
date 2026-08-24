import { Controller, Get, Param, Patch, Post, Query, UseGuards, Body } from '@nestjs/common';
import { AdminCustomOrdersService } from './admin-custom-orders.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { CustomQuotesService } from '../custom-quotes/custom-quotes.service';
import { CustomMessagesService } from '../custom-messages/custom-messages.service';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminUser, SenderType } from '@prisma/client';

@Controller('admin/custom-orders')
@UseGuards(AdminJwtAuthGuard)
export class AdminCustomOrdersController {
  constructor(
    private readonly svc: AdminCustomOrdersService,
    private readonly quotes: CustomQuotesService,
    private readonly messages: CustomMessagesService,
  ) {}

  @Get('requests')
  findAllRequests(@Query('status') status?: string, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.svc.findAllRequests({ status, skip, take });
  }

  @Get('requests/:id')
  getRequestDetail(@Param('id') id: string) {
    return this.svc.getRequestDetail(id);
  }

  @Patch('requests/:id/status')
  updateRequestStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.svc.updateRequestStatus(id, data.status);
  }

  @Post('requests/:id/quotes')
  createQuote(
    @Param('id') id: string,
    @Body() data: { amount: number; description: string },
  ) {
    return this.quotes.create({
      customRequestId: id,
      baseProductPrice: data.amount,
      designFee: 0,
      subtotal: data.amount,
      total: data.amount,
      description: data.description,
    });
  }

  @Post('requests/:id/messages')
  createMessage(
    @Param('id') id: string,
    @Body() data: { message: string },
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.messages.create({
      customRequestId: id,
      senderId: admin.id,
      senderType: SenderType.ADMIN,
      message: data.message,
    });
  }
}
