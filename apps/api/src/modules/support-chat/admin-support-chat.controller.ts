import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminUser, SupportChatStatus } from '@prisma/client';
import { SupportChatService } from './support-chat.service';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';

@Controller('admin/support-chat')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminSupportChatController {
  constructor(private readonly chat: SupportChatService) {}

  @Get()
  getConversations(@Query('status') status?: string) {
    const normalized = status?.trim().toUpperCase();
    const validStatus =
      normalized && Object.values(SupportChatStatus).includes(normalized as SupportChatStatus)
        ? (normalized as SupportChatStatus)
        : undefined;

    return this.chat.getAdminConversations(validStatus);
  }

  @Get(':id')
  getConversation(@Param('id') id: string) {
    return this.chat.getAdminConversation(id);
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  sendMessage(
    @Param('id') id: string,
    @Body('message') message: string,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.chat.sendAdminMessage(id, admin.id, message);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    const normalized = status?.trim().toUpperCase() as SupportChatStatus;
    return this.chat.updateStatus(id, normalized);
  }
}
