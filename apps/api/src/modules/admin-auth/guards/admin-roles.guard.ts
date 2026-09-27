import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole, AdminUser } from '@prisma/client';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler() as object;
    const target = context.getClass() as object;
    const requiredRoles =
      Reflect.getMetadata(ADMIN_ROLES_KEY, handler) ??
      Reflect.getMetadata(ADMIN_ROLES_KEY, target);

    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AdminUser }>();
    const admin = request.user;

    if (!admin || !requiredRoles.includes(admin.role as AdminRole)) {
      throw new ForbiddenException('Insufficient admin permissions.');
    }

    return true;
  }
}
