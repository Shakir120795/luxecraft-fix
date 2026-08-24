import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Attach request ID for tracing
    const requestId = randomUUID();
    request.id = requestId;
    response.setHeader('X-Request-ID', requestId);

    const { method, url, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap((res) => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `[${requestId}] ${method} ${url} - Status: ${response.statusCode} - ${duration}ms - IP: ${ip}`,
        );
      }),
      catchError((err) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `[${requestId}] ${method} ${url} - Error: ${err.message} - ${duration}ms - IP: ${ip}`,
          err.stack,
        );
        throw err;
      }),
    );
  }
}
