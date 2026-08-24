import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

// Token TTL: 1 hour
const TTL_MS = 60 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  /**
   * Generate a password reset token.
   * Returns the token so the caller can dispatch the email.
   * Always returns success to the API caller (no email enumeration).
   */
  async generateToken(email: string): Promise<string | null> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Return null silently — caller should NOT reveal user non-existence
      return null;
    }

    // Invalidate any existing tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    return token;
  }

  /** Validate a token without consuming it. Returns userId if valid. */
  async validateToken(token: string): Promise<string> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException(
        'This password reset link is invalid or has expired.',
      );
    }

    return record.userId;
  }

  /** Consume the token and set a new password. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.validateToken(token);

    await this.users.updatePassword(userId, newPassword);

    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { used: true, usedAt: new Date() },
    });

    this.logger.log(`Password reset for user ${userId}`);
  }
}
