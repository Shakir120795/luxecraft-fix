import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminNotificationsService } from '../admin-notifications/admin-notifications.service';

const CUSTOMER = 'CUSTOMER';
const ADMIN = 'ADMIN';

@Injectable()
export class SupportChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: AdminNotificationsService,
  ) {}

  /** The signed-in customer's own thread. Marks admin replies as read. */
  async getMyConversation(userId: string) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) return { conversation: null, messages: [] };

    await this.prisma.supportMessage.updateMany({
      where: { conversationId: conversation.id, senderType: ADMIN, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { conversation, messages: conversation.messages };
  }

  async sendCustomerMessage(userId: string, body: string) {
    const conversation = await this.prisma.supportConversation.upsert({
      where: { userId },
      create: { userId, status: 'OPEN' },
      update: { status: 'OPEN' },
    });

    const message = await this.prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        senderType: CUSTOMER,
        message: body.trim(),
      },
    });
    await this.prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    const admin = await this.prisma.adminUser.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (admin) {
      await this.notifications.send({
        recipientId: admin.id,
        type: 'SUPPORT_MESSAGE',
        title: 'New support chat message',
        message:
          `From: ${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer'} (${user?.email || userId})\n\n` +
          message.message,
        relatedId: conversation.id,
      });
    }
    return message;
  }

  /** Admin: conversation list, newest activity first, with unread counts. */
  async listConversationsForAdmin() {
    const conversations = await this.prisma.supportConversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    });

    const unread = await this.prisma.supportMessage.groupBy({
      by: ['conversationId'],
      where: { senderType: CUSTOMER, isRead: false },
      _count: { _all: true },
    });
    const unreadByConversation = new Map(unread.map((u) => [u.conversationId, u._count._all]));

    return conversations.map((c) => ({
      id: c.id,
      status: c.status,
      lastMessageAt: c.lastMessageAt ?? c.createdAt,
      createdAt: c.createdAt,
      user: c.user,
      lastMessage: c.messages[0] ?? null,
      messageCount: c._count.messages,
      unreadCount: unreadByConversation.get(c.id) ?? 0,
    }));
  }

  /** Admin: one thread. Marks customer messages as read. */
  async getConversationForAdmin(id: string) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    await this.prisma.supportMessage.updateMany({
      where: { conversationId: id, senderType: CUSTOMER, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return conversation;
  }

  async sendAdminMessage(conversationId: string, adminId: string, body: string) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const message = await this.prisma.supportMessage.create({
      data: { conversationId, senderId: adminId, senderType: ADMIN, message: body.trim() },
    });
    await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    return message;
  }

  async updateStatus(id: string, status: string) {
    const normalized = status.trim().toUpperCase();
    if (normalized !== 'OPEN' && normalized !== 'CLOSED') {
      throw new NotFoundException('Status must be OPEN or CLOSED');
    }
    return this.prisma.supportConversation.update({ where: { id }, data: { status: normalized } });
  }
}
