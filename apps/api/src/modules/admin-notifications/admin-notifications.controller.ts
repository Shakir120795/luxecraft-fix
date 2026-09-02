import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminNotificationsService } from './admin-notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class CustomerNotificationsController {
  constructor(private readonly notifications: AdminNotificationsService) {}
  @Get() list(@CurrentUser() user: { id: string }, @Query('unread') unread?: string) { return this.notifications.getForRecipient(user.id, unread === 'true'); }
  @Patch(':id/read') async read(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const items = await this.notifications.getForRecipient(user.id);
    if (!items.some((item) => item.id === id)) return { message: 'Notification not found.' };
    return this.notifications.markAsRead(id);
  }
}
