import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
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

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  type: 'access';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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
  ) {}

  // ----------------------------------------------------------------
  // Registration
  // ----------------------------------------------------------------

  async register(
    dto: RegisterDto,
    _meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ user: Omit<User, 'passwordHash'>; message: string }> {
    const user = await this.users.create(dto);
    // Send OTP (non-blocking — in production this dispatches a BullMQ email job)
    const _code = await this.otp.generate(
      user.email,
      OtpPurpose.EMAIL_VERIFICATION,
      user.id,
    );
    this.logger.log(`New registration: ${user.email} | OTP: ${_code} [DEV — remove in prod]`);
    return {
      user: this.users.sanitize(user),
      message:
        'Account created. Please check your email for a verification code.',
    };
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
    const blocked = await this.loginAttempts.isBlocked(normalEmail);
    if (blocked) {
      throw new ForbiddenException(
        'Too many failed login attempts. Please try again in 15 minutes.',
      );
    }

    const user = await this.users.findByEmail(normalEmail);
    const validPassword =
      user && user.passwordHash
        ? await this.users.verifyPassword(user, password)
        : false;

    if (!user || !validPassword) {
      await this.loginAttempts.record({
        email: normalEmail,
        userId: user?.id,
        ...meta,
        success: false,
        failReason: !user ? 'USER_NOT_FOUND' : 'INVALID_PASSWORD',
      });
      // Generic message — no email enumeration
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('This account has been suspended.');
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
    return { accessToken, refreshToken: result.newRefreshToken, expiresIn };
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

  async verifyEmail(email: string, code: string): Promise<void> {
    await this.otp.verify(email.toLowerCase(), code, OtpPurpose.EMAIL_VERIFICATION);
    const user = await this.users.findByEmail(email);
    if (user) {
      await this.users.markEmailVerified(user.id);
    }
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.emailVerified) return; // silent — no enumeration
    const _code = await this.otp.generate(
      user.email,
      OtpPurpose.EMAIL_VERIFICATION,
      user.id,
    );
    this.logger.log(`Resend OTP for ${email}: ${_code} [DEV — remove in prod]`);
  }

  // ----------------------------------------------------------------
  // Password reset
  // ----------------------------------------------------------------

  async forgotPassword(email: string): Promise<void> {
    const token = await this.passwordReset.generateToken(email);
    if (token) {
      this.logger.log(`Password reset token for ${email}: ${token} [DEV — remove in prod]`);
    }
    // Always return success — no email enumeration
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.passwordReset.resetPassword(token, newPassword);
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
    return { accessToken, refreshToken, expiresIn };
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
