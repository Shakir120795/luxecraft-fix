import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ADMIN_JWT_STRATEGY } from '../strategies/admin-jwt.strategy';

/** Protects routes that require a valid admin JWT. */
@Injectable()
export class AdminJwtAuthGuard extends AuthGuard(ADMIN_JWT_STRATEGY) {}
