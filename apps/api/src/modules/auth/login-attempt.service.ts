import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Lock account after this many consecutive failures within the window
const MAX_FAILURES = 10;
const WINDOW_MINUTES = 15;

@Injectable()
export class LoginAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    email: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    failReason?: string;
  }): Promise<void> {
    await this.prisma.loginAttempt.create({ data: params });
  }

  /** Returns true if the email is temporarily blocked due to too many failures. */
  async isBlocked(email: string): Promise<boolean> {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
    const count = await this.prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: since },
      },
    });
    return count >= MAX_FAILURES;
  }
}
