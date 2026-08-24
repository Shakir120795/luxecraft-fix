import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

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
        refreshToken,
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
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: oldToken },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date()
    ) {
      return null;
    }

    // Revoke old token (rotation)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const newRefreshToken = await this.create(session.userId, meta);
    return { userId: session.userId, newRefreshToken };
  }

  /** Revoke a single session by refresh token. */
  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshToken },
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
