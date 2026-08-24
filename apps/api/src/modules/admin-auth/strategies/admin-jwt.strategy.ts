import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AdminAuthService, AdminJwtPayload } from '../admin-auth.service';
import { AdminUser } from '@prisma/client';

export const ADMIN_JWT_STRATEGY = 'admin-jwt';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, ADMIN_JWT_STRATEGY) {
  constructor(
    config: ConfigService,
    private readonly adminAuth: AdminAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.adminSecret') ?? 'dev_admin_secret',
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminUser> {
    const admin = await this.adminAuth.validateJwtPayload(payload);
    if (!admin) throw new UnauthorizedException('Invalid or expired admin token.');
    return admin;
  }
}
