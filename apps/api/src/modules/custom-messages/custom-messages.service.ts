import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomMessage, SenderType, Prisma } from '@prisma/client';

@Injectable()
export class CustomMessagesService {
  private readonly logger = new Logger(CustomMessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    customRequestId: string;
    senderId: string;
    senderType: SenderType;
    message: string;
    attachments?: string[];
  }): Promise<CustomMessage> {
    return this.prisma.customMessage.create({
      data: {
        customRequestId: data.customRequestId,
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        attachments: data.attachments ?? [],
        isRead: false,
      },
    });
  }

  async findAll(customRequestId: string): Promise<CustomMessage[]> {
    return this.prisma.customMessage.findMany({
      where: { customRequestId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsRead(id: string): Promise<CustomMessage> {
    return this.prisma.customMessage.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(customRequestId: string): Promise<void> {
    await this.prisma.customMessage.updateMany({
      where: { customRequestId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async countUnread(customRequestId: string): Promise<number> {
    return this.prisma.customMessage.count({
      where: { customRequestId, isRead: false },
    });
  }
}
