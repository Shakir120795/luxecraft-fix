import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupportChatStatus, SenderType } from '@prisma/client';

const MAX_MESSAGE_LENGTH = 2000;

@Injectable()
export class SupportChatService {
  private readonly logger = new Logger(SupportChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateForUser(userId: string) {
    const conversation = await this.prisma.supportConversation.upsert({
      where: { userId },
      create: { userId, status: SupportChatStatus.OPEN },
      update: {},
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 200,
        },
      },
    });

    await this.prisma.supportMessage.updateMany({
      where: {
        conversationId: conversation.id,
        senderType: SenderType.ADMIN,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return this.getUserConversation(userId);
  }

  async getUserConversation(userId: string) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 200,
        },
      },
    });

    if (!conversation) return this.getOrCreateForUser(userId);
    return conversation;
  }

  async sendCustomerMessage(userId: string, rawMessage: string) {
    const message = this.validateMessage(rawMessage);

    const conversation = await this.prisma.supportConversation.upsert({
      where: { userId },
      create: {
        userId,
        status: SupportChatStatus.OPEN,
        lastMessageAt: new Date(),
      },
      update: {
        status: SupportChatStatus.OPEN,
        lastMessageAt: new Date(),
      },
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.supportMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          senderType: SenderType.CUSTOMER,
          message,
        },
      });

      await tx.supportConversation.update({
        where: { id: conversation.id },
        data: {
          status: SupportChatStatus.OPEN,
          lastMessageAt: createdMessage.createdAt,
        },
      });

      return createdMessage;
    });

    this.logger.log(`Customer support message received for conversation ${conversation.id}`);
    return created;
  }

  async getAdminConversations(status?: SupportChatStatus) {
    const conversations = await this.prisma.supportConversation.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: 'asc' }, { lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderType: true,
            message: true,
            createdAt: true,
            isRead: true,
          },
        },
      },
      take: 200,
    });

    const unreadCounts = await Promise.all(
      conversations.map(async (conversation) => ({
        conversationId: conversation.id,
        unreadCount: await this.prisma.supportMessage.count({
          where: {
            conversationId: conversation.id,
            senderType: SenderType.CUSTOMER,
            isRead: false,
          },
        }),
      })),
    );

    const unreadByConversation = new Map(
      unreadCounts.map((item) => [item.conversationId, item.unreadCount]),
    );

    return conversations.map((conversation) => ({
      ...conversation,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
    }));
  }

  async getAdminConversation(conversationId: string) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 500,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    await this.prisma.supportMessage.updateMany({
      where: {
        conversationId,
        senderType: SenderType.CUSTOMER,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 500,
        },
      },
    });
  }

  async sendAdminMessage(conversationId: string, adminId: string, rawMessage: string) {
    const message = this.validateMessage(rawMessage);

    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.supportMessage.create({
        data: {
          conversationId,
          senderId: adminId,
          senderType: SenderType.ADMIN,
          message,
        },
      });

      await tx.supportConversation.update({
        where: { id: conversationId },
        data: {
          status: SupportChatStatus.OPEN,
          lastMessageAt: createdMessage.createdAt,
        },
      });

      return createdMessage;
    });

    return created;
  }

  async updateStatus(conversationId: string, status: SupportChatStatus) {
    if (!Object.values(SupportChatStatus).includes(status)) {
      throw new BadRequestException('Invalid support chat status');
    }

    return this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status },
    });
  }

  private validateMessage(rawMessage: string) {
    const message = String(rawMessage ?? '').trim();

    if (!message) {
      throw new BadRequestException('Message cannot be empty');
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException('Message must be 2000 characters or fewer');
    }

    return message;
  }
}
