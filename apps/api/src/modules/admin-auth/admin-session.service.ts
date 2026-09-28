import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { hashOpaqueToken } from '../../common/utils/token-hash.util';

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
      data: { adminId, refreshTokenHash: hashOpaqueToken(refreshToken), ipAddress: meta.ipAddress, userAgent: meta.userAgent, expiresAt },
    });
    return refreshToken;
  }

  async rotate(
    oldToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ adminId: string; newRefreshToken: string } | null> {
    const now = new Date();
    const newRefreshToken = crypto.randomBytes(48).toString('hex');
    const newRefreshTokenHash = hashOpaqueToken(newRefreshToken);
    const oldRefreshTokenHash = hashOpaqueToken(oldToken);
    const expiresAt = new Date(now.getTime() + this.TTL_MS);

    return this.prisma.$transaction(async (tx) => {
      // Atomically claim the old token. Exactly one concurrent refresh can win.
      const revoked = await tx.adminSession.updateMany({
        where: {
          refreshTokenHash: oldRefreshTokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });

      if (revoked.count !== 1) return null;

      const session = await tx.adminSession.findUnique({
        where: { refreshTokenHash: oldRefreshTokenHash },
        select: { adminId: true },
      });

      if (!session) return null;

      await tx.adminSession.create({
        data: {
          adminId: session.adminId,
          refreshTokenHash: newRefreshTokenHash,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          expiresAt,
        },
      });

      return { adminId: session.adminId, newRefreshToken };
    });
  }
  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.adminSession.updateMany({
      where: { refreshTokenHash: hashOpaqueToken(refreshToken) },
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
