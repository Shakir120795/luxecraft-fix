import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AdminUser, AdminRole } from '@prisma/client';

/**
 * Requires the authenticated admin to have SUPER_ADMIN role.
 * Must be used after AdminJwtAuthGuard.
 *
 * SUPER_ADMIN is the privileged administrative role.
 * Use this guard only for operations that must remain reserved
 * for the highest-privilege administrator.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AdminUser }>();
    const admin = request.user;
    if (!admin || admin.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin access required.');
    }
    return true;
  }
}
