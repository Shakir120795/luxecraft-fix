import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY } from '../strategies/jwt.strategy';

/**
 * Optional JWT guard — attaches user to request if token present,
 * but does NOT reject unauthenticated requests (for guest-accessible routes).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard(JWT_STRATEGY) {
  handleRequest<T>(_err: unknown, user: T): T {
    // Return user if authenticated, null if not — never throws
    return user;
  }
}
