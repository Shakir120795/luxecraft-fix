import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ----- Security headers (Helmet) --------------------------
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ----- Cookie parser ---------------------------------------
  app.use(cookieParser());

  // ----- Global prefix and API versioning ------------------
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ----- CORS ----------------------------------------------
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
    'http://localhost:3000',
    'http://localhost:3002',
  ];
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400,
  });

  // ----- Global validation pipe ----------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ----- Global exception filter ---------------------------
  app.useGlobalFilters(new AllExceptionsFilter());

  // ----- Global interceptors --------------------------------
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  logger.log(`LuxeCraft API running on http://localhost:${port}/api/v1`);
  logger.log(`Health:  GET http://localhost:${port}/api/v1/health`);
  logger.log(`Auth:    POST http://localhost:${port}/api/v1/auth/register`);
  logger.log(`Admin:   POST http://localhost:${port}/api/v1/admin/auth/login`);
}

bootstrap();
