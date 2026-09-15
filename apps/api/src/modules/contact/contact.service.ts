import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminNotificationsService } from '../admin-notifications/admin-notifications.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: AdminNotificationsService,
  ) {}

  async findAllForAdmin(status?: string) {
    return this.prisma.contactMessage.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status: status.trim().toUpperCase() },
    });
  }
  async create(data: {
    userId?: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) {
    const contact = await this.prisma.contactMessage.create({
      data: {
        userId: data.userId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        subject: data.subject.trim(),
        message: data.message.trim(),
      },
    });

    const admin = await this.prisma.adminUser.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (admin) {
      await this.notifications.send({
        recipientId: admin.id,
        type: 'CONTACT_MESSAGE',
        title: `New Contact Query: ${contact.subject}`,
        message:
          `Name: ${contact.name}\n` +
          `Email: ${contact.email}\n` +
          `Phone: ${contact.phone || 'Not provided'}\n` +
          `Subject: ${contact.subject}\n\n` +
          `${contact.message}`,
        relatedId: contact.id,
      });
    }

    return contact;
  }
}
