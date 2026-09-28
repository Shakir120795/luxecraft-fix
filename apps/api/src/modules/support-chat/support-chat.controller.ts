import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupportChatService } from './support-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('support-chat')
@UseGuards(JwtAuthGuard)
export class SupportChatController {
  constructor(private readonly chat: SupportChatService) {}

  @Get()
  getMyConversation(@CurrentUser() user: { id: string }) {
    return this.chat.getOrCreateForUser(user.id);
  }

  @Post('messages')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  sendMessage(
    @CurrentUser() user: { id: string },
    @Body('message') message: string,
  ) {
    return this.chat.sendCustomerMessage(user.id, message);
  }
}
