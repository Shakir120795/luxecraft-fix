import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, AdminUser } from '@prisma/client';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AdminUser }>();
    const admin = request.user;

    if (!admin || !requiredRoles.includes(admin.role)) {
      throw new ForbiddenException('Insufficient admin permissions.');
    }

    return true;
  }
}
