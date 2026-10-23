import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupportChatService } from './support-chat.service';
import { SendSupportMessageDto } from './dto/send-support-message.dto';

@Controller('support-chat')
@UseGuards(JwtAuthGuard)
export class SupportChatController {
  constructor(private readonly svc: SupportChatService) {}

  @Get('conversation')
  getConversation(@CurrentUser() user: { id: string }) {
    return this.svc.getMyConversation(user.id);
  }

  @Post('messages')
  sendMessage(@Body() dto: SendSupportMessageDto, @CurrentUser() user: { id: string }) {
    return this.svc.sendCustomerMessage(user.id, dto.body);
  }
}
