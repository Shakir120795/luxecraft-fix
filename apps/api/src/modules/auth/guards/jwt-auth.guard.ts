import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY } from '../strategies/jwt.strategy';

/** Protects routes that require a valid customer JWT. */
@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY) {}
