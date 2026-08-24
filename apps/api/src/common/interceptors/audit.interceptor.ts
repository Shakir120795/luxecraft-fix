import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AdminUser } from '@prisma/client';
import { Request } from 'express';

/**
 * Applied to admin mutation routes to automatically log outcomes.
 * Decorating a controller method with @UseInterceptors(AuditInterceptor)
 * records the action after a successful response.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AdminUser }>();
    const admin = req.user as AdminUser | undefined;
    const method = req.method;
    const path = req.path;

    return next.handle().pipe(
      tap(() => {
        if (admin && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          this.audit
            .log({
              adminId: admin.id,
              actor: admin.email,
              actorType: 'admin',
              action: `${method} ${path}`,
              resource: path,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            })
            .catch((err) => this.logger.error('AuditInterceptor write failed', err));
        }
      }),
    );
  }
}
