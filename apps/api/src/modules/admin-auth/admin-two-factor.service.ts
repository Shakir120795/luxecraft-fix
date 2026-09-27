import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRole } from '@prisma/client';
import * as crypto from 'crypto';

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_CHALLENGE_ATTEMPTS = 5;
const SECRET_BYTES = 20;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TWO_FACTOR_AAD = Buffer.from('wolhomes-admin-2fa');

export interface AdminTwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export interface AdminTwoFactorChallenge {
  challengeToken: string;
  expiresIn: number;
}

@Injectable()
export class AdminTwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  generateSecret(): string {
    const bytes = crypto.randomBytes(SECRET_BYTES);
    let value = '';
    let buffer = 0;
    let bits = 0;

    for (const byte of bytes) {
      buffer = (buffer << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        value += BASE32_ALPHABET[(buffer >> bits) & 31];
      }
    }

    if (bits > 0) {
      value += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
    }

    return value;
  }

  buildOtpauthUrl(email: string, secret: string): string {
    const issuer = 'Wolhomes Admin';
    return (
      `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
      `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
    );
  }

  async beginSetup(adminId: string, email: string): Promise<AdminTwoFactorSetup> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!admin) throw new UnauthorizedException('Admin account not found.');
    if (admin.twoFactorEnabled) {
      throw new ConflictException('Two-factor authentication is already enabled.');
    }

    const secret = admin.twoFactorSecret
      ? this.decryptSecret(admin.twoFactorSecret)
      : this.generateSecret();

    if (!admin.twoFactorSecret) {
      await this.prisma.adminUser.update({
        where: { id: adminId },
        data: { twoFactorSecret: this.encryptSecret(secret) },
      });
    }

    return {
      secret,
      otpauthUrl: this.buildOtpauthUrl(email, secret),
    };
  }

  async confirmSetup(
    adminId: string,
    code: string,
    verifyPassword: (adminId: string) => Promise<boolean>,
  ): Promise<void> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { email: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!admin) throw new UnauthorizedException('Admin account not found.');
    if (admin.twoFactorEnabled) {
      throw new ConflictException('Two-factor authentication is already enabled.');
    }
    if (!admin.twoFactorSecret) {
      throw new ConflictException('Start two-factor setup before confirming it.');
    }
    if (!(await verifyPassword(adminId))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const secret = this.decryptSecret(admin.twoFactorSecret);
    if (!this.verifyTotp(secret, code)) {
      throw new UnauthorizedException('Invalid two-factor authentication code.');
    }

    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: this.encryptSecret(secret),
      },
    });
  }

  async disable(
    adminId: string,
    code: string,
    verifyPassword: (adminId: string) => Promise<boolean>,
  ): Promise<void> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!admin) throw new UnauthorizedException('Admin account not found.');
    if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
      throw new ConflictException('Two-factor authentication is not enabled.');
    }
    if (!(await verifyPassword(adminId))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const secret = this.decryptSecret(admin.twoFactorSecret);
    if (!this.verifyTotp(secret, code)) {
      throw new UnauthorizedException('Invalid two-factor authentication code.');
    }

    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }

  verifyTotp(secret: string, code: string, timestamp = Date.now()): boolean {
    const normalizedCode = String(code).trim();
    if (!/^\d{6}$/.test(normalizedCode)) return false;

    const timeStep = Math.floor(timestamp / 1000 / TOTP_STEP_SECONDS);
    for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
      const expected = this.generateTotp(secret, timeStep + offset);
      const a = Buffer.from(expected);
      const b = Buffer.from(normalizedCode);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
    }

    return false;
  }

  generateChallengeToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashChallengeToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createChallenge(
    adminId: string,
    kind: 'LOGIN' | 'SETUP',
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<AdminTwoFactorChallenge> {
    const token = this.generateChallengeToken();
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

    await this.prisma.adminTwoFactorChallenge.create({
      data: {
        adminId,
        tokenHash: this.hashChallengeToken(token),
        kind,
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return { challengeToken: token, expiresIn: CHALLENGE_TTL_MS / 1000 };
  }

  async validateLoginChallenge(token: string) {
    const challenge = await this.prisma.adminTwoFactorChallenge.findUnique({
      where: { tokenHash: this.hashChallengeToken(token) },
    });

    if (
      !challenge ||
      challenge.kind !== 'LOGIN' ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired two-factor challenge.');
    }

    if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
      throw new UnauthorizedException('Too many two-factor attempts. Please sign in again.');
    }

    return challenge;
  }

  async recordChallengeFailure(id: string): Promise<void> {
    const challenge = await this.prisma.adminTwoFactorChallenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });

    if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
      await this.prisma.adminTwoFactorChallenge.update({
        where: { id },
        data: { consumedAt: new Date() },
      });
    }
  }

  async consumeChallenge(id: string): Promise<boolean> {
    const result = await this.prisma.adminTwoFactorChallenge.updateMany({
      where: {
        id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    return result.count === 1;
  }

  private generateTotp(secret: string, counter: number): string {
    const key = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buffer.writeUInt32BE(counter >>> 0, 4);

    const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
  }

  private base32Decode(value: string): Buffer {
    const normalized = value.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
    let buffer = 0;
    let bits = 0;
    const out: number[] = [];

    for (const char of normalized) {
      const index = BASE32_ALPHABET.indexOf(char);
      if (index < 0) throw new Error('Invalid two-factor secret.');
      buffer = (buffer << 5) | index;
      bits += 5;
      if (bits >= 8) {
        bits -= 8;
        out.push((buffer >> bits) & 0xff);
      }
    }

    return Buffer.from(out);
  }

  private encryptionKey(): Buffer {
    const adminSecret = this.config.get<string>('jwt.adminSecret') ?? 'dev_admin_secret';
    return crypto.createHash('sha256').update(`${adminSecret}:2fa`).digest();
  }

  private encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    cipher.setAAD(TWO_FACTOR_AAD);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      'v1',
      iv.toString('base64url'),
      tag.toString('base64url'),
      ciphertext.toString('base64url'),
    ].join('.');
  }

  private decryptSecret(value: string): string {
    if (!value.startsWith('v1.')) return value;

    const [, ivPart, tagPart, ciphertextPart] = value.split('.');
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey(),
        Buffer.from(ivPart, 'base64url'),
      );
      decipher.setAAD(TWO_FACTOR_AAD);
      decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextPart, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new UnauthorizedException('Two-factor secret cannot be decrypted.');
    }
  }
}
