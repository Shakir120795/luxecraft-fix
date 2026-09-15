import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async send(data: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
  }): Promise<any> {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId,
      },
    });

    void this.telegram.sendMessage(`🔔 ${data.title}\n\n${data.message}`);

    return notification;
  }

  async getForRecipient(
    recipientId: string,
    unreadOnly: boolean = false,
  ): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: {
        recipientId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string): Promise<any> {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }
}
