import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter.
 * Returns a consistent error shape for all unhandled exceptions.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string | string[]) ?? exception.message;
        error = (resp['error'] as string) ?? exception.name;
      }
    }

    // Never expose internal exception details for 5xx responses.
    if (status >= 500) {
      message = 'Internal server error';
      error = 'InternalServerError';
    }

    // Use request.path so query-string values are not reflected in the
    // response or application logs.
    const safePath = request.path || request.url.split('?')[0];

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${safePath}  ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${safePath}  ${status}: ${message}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      path: safePath,
      timestamp: new Date().toISOString(),
    });
  }
}
