import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(data: { recipientId: string; type: string; title: string; message: string; relatedId?: string }): Promise<any> {
    return this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId,
      },
    });
  }

  async getForRecipient(recipientId: string, unreadOnly: boolean = false): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: { recipientId, ...(unreadOnly && { read: false }) },
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
