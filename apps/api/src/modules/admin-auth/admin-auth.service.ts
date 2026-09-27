import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AdminSessionService } from './admin-session.service';
import { AdminTwoFactorService } from './admin-two-factor.service';
import { AdminUser, AdminStatus, AdminRole } from '@prisma/client';
import { CreateAdminDto } from './dto/create-admin.dto';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;
const MAX_FAILURES = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  type: 'admin-access';
}

export interface AdminTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  admin: Omit<AdminUser, 'passwordHash' | 'twoFactorSecret'>;
}

export interface AdminTwoFactorLoginChallenge {
  requiresTwoFactor: true;
  twoFactorToken: string;
  expiresIn: number;
  admin: Omit<AdminUser, 'passwordHash' | 'twoFactorSecret'>;
}

export type AdminLoginResult = AdminTokenPair | AdminTwoFactorLoginChallenge;

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: AdminSessionService,
    private readonly audit: AuditService,
    private readonly twoFactor: AdminTwoFactorService,
  ) {}

  // ----------------------------------------------------------------
  // Bootstrap / admin management
  // ----------------------------------------------------------------

  async createSuperAdmin(
    dto: CreateAdminDto,
    createdBy?: string,
  ): Promise<Omit<AdminUser, 'passwordHash' | 'twoFactorSecret'>> {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Admin account already exists.');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const admin = await this.prisma.adminUser.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? AdminRole.ADMIN,
      },
    });

    await this.audit.log({
      adminId: createdBy,
      actor: createdBy ?? 'system',
      actorType: 'admin',
      action: 'ADMIN_CREATED',
      resource: 'admin_users',
      resourceId: admin.id,
      after: { email: admin.email, role: admin.role },
    });

    return this.sanitize(admin);
  }

  // ----------------------------------------------------------------
  // Login
  // ----------------------------------------------------------------

  async login(
    email: string,
    password: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<AdminLoginResult> {
    const normalEmail = email.toLowerCase().trim();
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: normalEmail },
    });

    if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
      const remaining = Math.ceil(
        (admin.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account locked. Try again in ${remaining} minute(s).`,
      );
    }

    const validPassword =
      admin && admin.passwordHash
        ? await bcrypt.compare(password, admin.passwordHash)
        : false;

    if (!admin || !validPassword) {
      if (admin) {
        const newFailures = admin.failedLoginAttempts + 1;
        const shouldLock = newFailures >= MAX_FAILURES;
        await this.prisma.adminUser.update({
          where: { id: admin.id },
          data: {
            failedLoginAttempts: newFailures,
            ...(shouldLock && {
              lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
            }),
          },
        });
        await this.audit.log({
          adminId: admin.id,
          actor: admin.email,
          actorType: 'admin',
          action: 'ADMIN_LOGIN_FAILED',
          resource: 'admin_sessions',
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          after: { attempts: newFailures, locked: shouldLock },
        });
        if (shouldLock) {
          throw new ForbiddenException(
            'Too many failed attempts. Account locked for 30 minutes.',
          );
        }
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (admin.status === AdminStatus.SUSPENDED) {
      throw new ForbiddenException('This admin account has been suspended.');
    }

    if (admin.twoFactorEnabled) {
      if (!admin.twoFactorSecret) {
        throw new ForbiddenException(
          'Two-factor authentication is enabled but not configured correctly.',
        );
      }

      const challenge = await this.twoFactor.createChallenge(admin.id, 'LOGIN', meta);
      await this.audit.log({
        adminId: admin.id,
        actor: admin.email,
        actorType: 'admin',
        action: 'ADMIN_LOGIN_2FA_REQUIRED',
        resource: 'admin_sessions',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return {
        requiresTwoFactor: true,
        twoFactorToken: challenge.challengeToken,
        expiresIn: challenge.expiresIn,
        admin: this.sanitize(admin),
      };
    }

    return this.completeLogin(admin, meta);
  }

  async verifyTwoFactor(
    challengeToken: string,
    code: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<AdminTokenPair> {
    const challenge = await this.twoFactor.validateLoginChallenge(challengeToken);
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: challenge.adminId },
    });

    if (
      !admin ||
      admin.status !== AdminStatus.ACTIVE ||
      !admin.twoFactorEnabled ||
      !admin.twoFactorSecret
    ) {
      throw new UnauthorizedException('Admin account is not available for two-factor verification.');
    }

    let valid = false;
    try {
      valid = this.twoFactor.verifyTotp(
        this.twoFactor.decryptForVerification(admin.twoFactorSecret),
        code,
      );
    } catch {
      valid = false;
    }

    if (!valid) {
      await this.twoFactor.recordChallengeFailure(challenge.id);

      const refreshed = await this.prisma.adminUser.findUnique({
        where: { id: admin.id },
        select: { failedLoginAttempts: true },
      });
      const newFailures = (refreshed?.failedLoginAttempts ?? 0) + 1;
      const shouldLock = newFailures >= MAX_FAILURES;
      await this.prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: newFailures,
          ...(shouldLock && {
            lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
          }),
        },
      });

      await this.audit.log({
        adminId: admin.id,
        actor: admin.email,
        actorType: 'admin',
        action: 'ADMIN_LOGIN_2FA_FAILED',
        resource: 'admin_sessions',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        after: { attempts: newFailures, locked: shouldLock },
      });

      if (shouldLock) {
        throw new ForbiddenException(
          'Too many failed attempts. Account locked for 30 minutes.',
        );
      }

      throw new UnauthorizedException('Invalid two-factor authentication code.');
    }

    const consumed = await this.twoFactor.consumeChallenge(challenge.id);
    if (!consumed) {
      throw new UnauthorizedException('Two-factor challenge has already been used or expired.');
    }

    return this.completeLogin(admin, meta, 'ADMIN_LOGIN_2FA_SUCCESS');
  }

  async beginTwoFactorSetup(adminId: string): Promise<ReturnType<AdminTwoFactorService['beginSetup']>> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { email: true },
    });
    if (!admin) throw new UnauthorizedException('Admin account not found.');
    return this.twoFactor.beginSetup(adminId, admin.email);
  }

  async confirmTwoFactorSetup(
    admin: AdminUser,
    password: string,
    code: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    await this.twoFactor.confirmSetup(admin.id, code);
    await this.sessions.revokeAll(admin.id);

    await this.audit.log({
      adminId: admin.id,
      actor: admin.email,
      actorType: 'admin',
      action: 'ADMIN_2FA_ENABLED',
      resource: 'admin_users',
      resourceId: admin.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  async disableTwoFactor(
    admin: AdminUser,
    password: string,
    code: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    await this.twoFactor.disable(admin.id, code);
    await this.sessions.revokeAll(admin.id);

    await this.audit.log({
      adminId: admin.id,
      actor: admin.email,
      actorType: 'admin',
      action: 'ADMIN_2FA_DISABLED',
      resource: 'admin_users',
      resourceId: admin.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  // ----------------------------------------------------------------
  // Token operations
  // ----------------------------------------------------------------

  async refresh(
    oldToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<AdminTokenPair> {
    const result = await this.sessions.rotate(oldToken, meta);
    if (!result) throw new UnauthorizedException('Invalid or expired refresh token.');

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: result.adminId },
    });
    if (!admin || admin.status !== AdminStatus.ACTIVE) {
      throw new UnauthorizedException('Admin account is no longer active.');
    }

    const accessToken = this.signAccessToken(admin);
    const expiresIn = this.accessTokenTtlSeconds();
    return {
      accessToken,
      refreshToken: result.newRefreshToken,
      expiresIn,
      admin: this.sanitize(admin),
    };
  }

  async logout(
    refreshToken: string,
    admin: AdminUser,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    await this.sessions.revoke(refreshToken);
    await this.audit.log({
      adminId: admin.id,
      actor: admin.email,
      actorType: 'admin',
      action: 'ADMIN_LOGOUT',
      resource: 'admin_sessions',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  async validateJwtPayload(payload: AdminJwtPayload): Promise<AdminUser | null> {
    if (payload.type !== 'admin-access') return null;
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });
    if (!admin || admin.status !== AdminStatus.ACTIVE) return null;
    return admin;
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  private async completeLogin(
    admin: AdminUser,
    meta: { ipAddress?: string; userAgent?: string },
    auditAction = 'ADMIN_LOGIN_SUCCESS',
  ): Promise<AdminTokenPair> {
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ipAddress,
      },
    });

    await this.audit.log({
      adminId: admin.id,
      actor: admin.email,
      actorType: 'admin',
      action: auditAction,
      resource: 'admin_sessions',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return this.issueTokens(admin, meta);
  }

  private async issueTokens(
    admin: AdminUser,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<AdminTokenPair> {
    const accessToken = this.signAccessToken(admin);
    const refreshToken = await this.sessions.create(admin.id, meta);
    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTtlSeconds(),
      admin: this.sanitize(admin),
    };
  }

  private signAccessToken(admin: AdminUser): string {
    const payload: AdminJwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin-access',
    };
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.adminSecret'),
      expiresIn: this.config.get<string>('jwt.adminExpiresIn', '8h'),
    });
  }

  private accessTokenTtlSeconds(): number {
    const raw = this.config.get<string>('jwt.adminExpiresIn', '8h');
    if (raw.endsWith('m')) return parseInt(raw) * 60;
    if (raw.endsWith('h')) return parseInt(raw) * 3600;
    if (raw.endsWith('d')) return parseInt(raw) * 86400;
    return parseInt(raw);
  }

  sanitize(
    admin: AdminUser,
  ): Omit<AdminUser, 'passwordHash' | 'twoFactorSecret'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, twoFactorSecret: _tf, ...safe } = admin;
    return safe;
  }
}
