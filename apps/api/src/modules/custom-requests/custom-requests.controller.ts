import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import { CustomRequestsService } from './custom-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomMessagesService } from '../custom-messages/custom-messages.service';
import { SenderType } from '@prisma/client';

@Controller('custom-requests')
export class CustomRequestsController {
  constructor(
    private readonly svc: CustomRequestsService,
    private readonly messages: CustomMessagesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() data: any) {
    return this.svc.create({ userId: user.id, ...data });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: { id: string }) {
    return this.svc.findAllForUser(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.findOneForUser(id, user.id);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  async createMessage(
    @Param('id') id: string,
    @Body('message') message: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.svc.findOneForUser(id, user.id);
    return this.messages.create({
      customRequestId: id,
      senderId: user.id,
      senderType: SenderType.CUSTOMER,
      message,
    });
  }
}
