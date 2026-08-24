import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpPurpose } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly ttlMinutes: number;
  private readonly codeLength: number;
  private readonly maxAttempts = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.ttlMinutes = config.get<number>('OTP_EXPIRES_MINUTES', 10);
    this.codeLength = config.get<number>('OTP_LENGTH', 6);
  }

  /** Generate and persist a new OTP code for an email + purpose. */
  async generate(
    email: string,
    purpose: OtpPurpose,
    userId?: string,
  ): Promise<string> {
    // Invalidate any existing unused codes for this email+purpose
    await this.prisma.otpCode.updateMany({
      where: { email: email.toLowerCase(), purpose, used: false },
      data: { used: true },
    });

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.ttlMinutes * 60 * 1000);

    await this.prisma.otpCode.create({
      data: {
        email: email.toLowerCase(),
        code,
        purpose,
        userId,
        expiresAt,
      },
    });

    this.logger.debug(`OTP generated for ${email} [${purpose}]`);
    return code;
  }

  /** Verify an OTP code. Consumes it on success. */
  async verify(
    email: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const record = await this.prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        purpose,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    // Increment attempt counter
    const updated = await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    if (updated.attempts > this.maxAttempts) {
      // Invalidate after too many attempts
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { used: true },
      });
      throw new BadRequestException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    if (record.code !== code) {
      throw new BadRequestException('Invalid verification code.');
    }

    // Mark as used
    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { used: true, usedAt: new Date() },
    });

    return true;
  }

  private generateCode(): string {
    // Cryptographically random numeric code
    const max = Math.pow(10, this.codeLength);
    const num = crypto.randomInt(0, max);
    return num.toString().padStart(this.codeLength, '0');
  }
}
