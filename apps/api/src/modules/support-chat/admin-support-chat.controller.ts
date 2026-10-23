import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { SupportChatService } from './support-chat.service';
import { SendSupportMessageDto } from './dto/send-support-message.dto';

@Controller('admin/support-chat')
@UseGuards(AdminJwtAuthGuard)
export class AdminSupportChatController {
  constructor(private readonly svc: SupportChatService) {}

  @Get('conversations')
  list() {
    return this.svc.listConversationsForAdmin();
  }

  @Get('conversations/:id')
  getOne(@Param('id') id: string) {
    return this.svc.getConversationForAdmin(id);
  }

  @Post('conversations/:id/messages')
  reply(@Param('id') id: string, @Body() dto: SendSupportMessageDto) {
    return this.svc.sendAdminMessage(id, dto.body);
  }

  @Patch('conversations/:id/status')
  setStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }
}
