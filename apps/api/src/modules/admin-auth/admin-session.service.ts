import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AdminSessionService {
  private readonly logger = new Logger(AdminSessionService.name);
  // Admin refresh token TTL: 7 days (shorter than customer 30d)
  private readonly TTL_MS = 7 * 24 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async create(
    adminId: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + this.TTL_MS);
    await this.prisma.adminSession.create({
      data: { adminId, refreshToken, ipAddress: meta.ipAddress, userAgent: meta.userAgent, expiresAt },
    });
    return refreshToken;
  }

  async rotate(
    oldToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ adminId: string; newRefreshToken: string } | null> {
    const session = await this.prisma.adminSession.findUnique({
      where: { refreshToken: oldToken },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }
    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const newRefreshToken = await this.create(session.adminId, meta);
    return { adminId: session.adminId, newRefreshToken };
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.adminSession.updateMany({
      where: { refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(adminId: string): Promise<void> {
    await this.prisma.adminSession.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
