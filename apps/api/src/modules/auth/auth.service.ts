import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { OtpService } from '../otp/otp.service';
import { SessionService } from './session.service';
import { PasswordResetService } from './password-reset.service';
import { LoginAttemptService } from './login-attempt.service';
import { User, OtpPurpose, UserStatus } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { RedisService } from '../redis/redis.service';

const DUMMY_PASSWORD_HASH = '$2b$12$PjFGb4R2ZsGoGdN5NlnhaO/rhab96Xx9anmLIlZRhapRdIkz//Zzu';

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  type: 'access';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<User, 'passwordHash'>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly sessions: SessionService,
    private readonly passwordReset: PasswordResetService,
    private readonly loginAttempts: LoginAttemptService,
    private readonly email: EmailService,
    private readonly redis: RedisService,
  ) {}

  // ----------------------------------------------------------------
  // Registration
  // ----------------------------------------------------------------

  async register(
    dto: RegisterDto,
    _meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.users.findByEmail(email);

    if (existing) {
      if (existing.emailVerified) {
        throw new ConflictException(
          'An account with this email already exists. Please sign in.',
        );
      }

      try {
        const code = await this.otp.generate(
          existing.email,
          OtpPurpose.EMAIL_VERIFICATION,
          existing.id,
        );
        await this.email.sendVerificationCode(existing.email, code);
      } catch (error) {
        this.logger.error('Failed to send verification email to ' + email, error);
        throw new BadRequestException(
          'Unable to send the verification code right now. Please try again.',
        );
      }

      return {
        message:
          'Verification code sent. Verify your email before creating your Wolhomes account.',
      };
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const pending = {
      email,
      passwordHash,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      phone: dto.phone ?? null,
    };

    const pendingKey = this.pendingRegistrationKey(email);
    const ttlSeconds = Math.max(
      60,
      this.config.get<number>('OTP_EXPIRES_MINUTES', 10) * 60,
    );

    await this.redis.set(pendingKey, JSON.stringify(pending), ttlSeconds);

    try {
      const code = await this.otp.generate(
        email,
        OtpPurpose.EMAIL_VERIFICATION,
      );
      await this.email.sendVerificationCode(email, code);
    } catch (error) {
      await this.redis.del(pendingKey);
      this.logger.error('Failed to send verification email to ' + email, error);
      throw new BadRequestException(
        'Unable to send the verification code right now. Please check the email service configuration and try again.',
      );
    }

    return {
      message:
        'Verification code sent. Verify your email before creating your Wolhomes account.',
    };
  }

  async sendVerificationCode(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.users.findByEmail(normalizedEmail);

    if (existing?.emailVerified) {
      throw new ConflictException(
        'An account with this email already exists. Please sign in.',
      );
    }

    try {
      const code = await this.otp.generate(
        normalizedEmail,
        OtpPurpose.EMAIL_VERIFICATION,
        existing?.id,
      );
      await this.email.sendVerificationCode(normalizedEmail, code);
    } catch (error) {
      this.logger.error(
        'Failed to send verification email to ' + normalizedEmail,
        error,
      );
      throw new BadRequestException(
        'Unable to send the verification code right now. Please check the email service configuration and try again.',
      );
    }

    return { message: 'Verification code sent. Check your email.' };
  }

  // ----------------------------------------------------------------
  // Login
  // ----------------------------------------------------------------

  async login(
    email: string,
    password: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<TokenPair> {
    const normalEmail = email.toLowerCase().trim();

    // Check rate-limit lockout
    const blocked = await this.loginAttempts.isBlocked(normalEmail, meta.ipAddress);
    if (blocked) {
      throw new ForbiddenException(
        'Too many failed login attempts. Please try again in 15 minutes.',
      );
    }

    const user = await this.users.findByEmail(normalEmail);
    const validPassword = user
      ? await this.users.verifyPassword(user, password)
      : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

    if (!user) {
      await this.loginAttempts.record({
        email: normalEmail,
        ...meta,
        success: false,
        failReason: 'USER_NOT_FOUND',
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!validPassword) {
      await this.loginAttempts.record({
        email: normalEmail,
        userId: user.id,
        ...meta,
        success: false,
        failReason: 'INVALID_PASSWORD',
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before signing in.',
      );
    }

    await this.loginAttempts.record({
      email: normalEmail,
      userId: user.id,
      ...meta,
      success: true,
    });
    await this.users.recordLogin(user.id);

    return this.issueTokens(user, meta);
  }

  // ----------------------------------------------------------------
  // Token operations
  // ----------------------------------------------------------------

  async refresh(
    oldRefreshToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<TokenPair> {
    const result = await this.sessions.rotate(oldRefreshToken, meta);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    const user = await this.users.findById(result.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is no longer active.');
    }
    const accessToken = this.signAccessToken(user);
    const expiresIn = this.accessTokenTtlSeconds();
    return { accessToken, refreshToken: result.newRefreshToken, expiresIn, user: this.users.sanitize(user) };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessions.revoke(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.revokeAll(userId);
  }

  // ----------------------------------------------------------------
  // Email verification
  // ----------------------------------------------------------------

  async verifyEmail(
    email: string,
    code: string,
  ): Promise<{ message: string; registrationToken?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const pendingKey = this.pendingRegistrationKey(normalizedEmail);
    const pendingRaw = await this.redis.get(pendingKey);

    await this.otp.verify(
      normalizedEmail,
      code,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    if (pendingRaw) {
      let pending: {
        email: string;
        passwordHash: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
      };

      try {
        pending = JSON.parse(pendingRaw);
      } catch {
        await this.redis.del(pendingKey);
        throw new BadRequestException(
          'Registration session expired. Please start registration again.',
        );
      }

      const registrationToken = randomBytes(32).toString('base64url');
      await this.redis.set(
        this.verifiedRegistrationKey(registrationToken),
        JSON.stringify(pending),
        15 * 60,
      );
      await this.redis.del(pendingKey);

      return {
        message: 'Email verified. You can now create your Wolhomes account.',
        registrationToken,
      };
    }

    const user = await this.users.findByEmail(normalizedEmail);
    if (user) {
      if (!user.emailVerified) {
        await this.users.markEmailVerified(user.id);
      }

      return { message: 'Email verified successfully. Please sign in.' };
    }

    const registrationToken = randomBytes(32).toString('base64url');
    await this.redis.set(
      this.verifiedRegistrationKey(registrationToken),
      JSON.stringify({ email: normalizedEmail }),
      15 * 60,
    );

    return {
      message: 'Email verified. You can now create your Wolhomes account.',
      registrationToken,
    };
  }

  async completeRegistration(
    registrationToken: string,
    data?: {
      password: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ): Promise<{ message: string }> {
    const key = this.verifiedRegistrationKey(registrationToken);
    const verifiedRaw = await this.redis.get(key);

    if (!verifiedRaw) {
      throw new BadRequestException(
        'Registration verification expired. Please verify your email again.',
      );
    }

    let verified: {
      email: string;
      passwordHash?: string;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
    };

    try {
      verified = JSON.parse(verifiedRaw);
    } catch {
      await this.redis.del(key);
      throw new BadRequestException(
        'Registration verification expired. Please start again.',
      );
    }

    const existing = await this.users.findByEmail(verified.email);
    if (existing) {
      await this.redis.del(key);

      if (existing.emailVerified) {
        throw new ConflictException('An account with this email already exists.');
      }

      await this.users.markEmailVerified(existing.id);
      return { message: 'Your existing account has been verified successfully.' };
    }

    if (verified.passwordHash) {
      await this.users.createWithPasswordHash({
        email: verified.email,
        passwordHash: verified.passwordHash,
        firstName: verified.firstName ?? undefined,
        lastName: verified.lastName ?? undefined,
        phone: verified.phone ?? undefined,
      });
    } else {
      if (!data?.password) {
        throw new BadRequestException(
          'Please provide your registration details to create the account.',
        );
      }

      await this.users.create({
        email: verified.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
    }

    await this.redis.del(key);
    return { message: 'Account created successfully. You can now sign in.' };
  }

  async resendVerification(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const pendingKey = this.pendingRegistrationKey(normalizedEmail);
    const pendingRaw = await this.redis.get(pendingKey);

    if (pendingRaw) {
      const code = await this.otp.generate(
        normalizedEmail,
        OtpPurpose.EMAIL_VERIFICATION,
      );
      await this.email.sendVerificationCode(normalizedEmail, code);
      return;
    }

    const user = await this.users.findByEmail(normalizedEmail);
    if (!user || user.emailVerified) return;

    const code = await this.otp.generate(
      user.email,
      OtpPurpose.EMAIL_VERIFICATION,
      user.id,
    );
    await this.email.sendVerificationCode(user.email, code);
  }

  private pendingRegistrationKey(email: string): string {
    return 'auth:pending-registration:' + email.toLowerCase().trim();
  }

  private verifiedRegistrationKey(token: string): string {
    return 'auth:verified-registration:' + token;
  }

  // ----------------------------------------------------------------
  // Password reset
  // ----------------------------------------------------------------

  async forgotPassword(email: string): Promise<void> {
    const token = await this.passwordReset.generateToken(email);
    if (token) {
      await this.email.sendPasswordResetEmail(email, token);
    }
    // Always return success  no email enumeration
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.passwordReset.resetPassword(token, newPassword);
    await this.sessions.revokeAll(userId);
  }

  async changePassword(user: User, currentPassword: string, newPassword: string): Promise<void> {
    if (!(await this.users.verifyPassword(user, currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    await this.users.updatePassword(user.id, newPassword);
    await this.sessions.revokeAll(user.id);
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.users.sanitize(await this.users.updateProfile(userId, data));
  }

  // ----------------------------------------------------------------
  // Validate user from JWT payload (used by JwtStrategy)
  // ----------------------------------------------------------------

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    if (payload.type !== 'access') return null;
    const user = await this.users.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) return null;
    return user;
  }

  // ----------------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------------

  private async issueTokens(
    user: User,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<TokenPair> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.sessions.create(user.id, meta);
    const expiresIn = this.accessTokenTtlSeconds();
    return { accessToken, refreshToken, expiresIn, user: this.users.sanitize(user) };
  }

  private signAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn', '15m'),
    });
  }

  private accessTokenTtlSeconds(): number {
    const raw = this.config.get<string>('jwt.expiresIn', '15m');
    if (raw.endsWith('m')) return parseInt(raw) * 60;
    if (raw.endsWith('h')) return parseInt(raw) * 3600;
    if (raw.endsWith('d')) return parseInt(raw) * 86400;
    return parseInt(raw);
  }
}
