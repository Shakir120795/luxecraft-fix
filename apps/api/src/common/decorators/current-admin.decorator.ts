import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminUser } from '@prisma/client';
import { Request } from 'express';

/**
 * Extracts the authenticated admin from the request.
 * Use inside routes protected by AdminJwtAuthGuard.
 */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AdminUser }>();
    return request.user;
  },
);
