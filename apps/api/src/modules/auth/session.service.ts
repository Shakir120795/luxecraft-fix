import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { hashOpaqueToken } from '../../common/utils/token-hash.util';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  // Refresh token TTL: 30 days
  private readonly TTL_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  /** Create a new session and return the opaque refresh token. */
  async create(
    userId: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + this.TTL_MS);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: hashOpaqueToken(refreshToken),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    return refreshToken;
  }

  /** Validate and rotate a refresh token. Returns userId or null if invalid. */
  async rotate(
    oldToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ userId: string; newRefreshToken: string } | null> {
    const now = new Date();
    const newRefreshToken = crypto.randomBytes(48).toString('hex');
    const newRefreshTokenHash = hashOpaqueToken(newRefreshToken);
    const oldRefreshTokenHash = hashOpaqueToken(oldToken);
    const expiresAt = new Date(now.getTime() + this.TTL_MS);

    return this.prisma.$transaction(async (tx) => {
      // Atomically claim the old token. Exactly one concurrent refresh can win.
      const revoked = await tx.session.updateMany({
        where: {
          refreshTokenHash: oldRefreshTokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });

      if (revoked.count !== 1) return null;

      const session = await tx.session.findUnique({
        where: { refreshTokenHash: oldRefreshTokenHash },
        select: { userId: true },
      });

      if (!session) return null;

      await tx.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: newRefreshTokenHash,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          expiresAt,
        },
      });

      return { userId: session.userId, newRefreshToken };
    });
  }

  /** Revoke a single session by refresh token. */
  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hashOpaqueToken(refreshToken) },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoke all sessions for a user (logout everywhere). */
  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Purge expired sessions older than 90 days (intended for scheduled cleanup). */
  async purgeExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });
    return result.count;
  }
}
