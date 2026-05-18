import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as Sentry from '@sentry/nestjs';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // ── Sentry init (before anything else) ──────────────────────────────
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.2,
    });
  }

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
    logger: new NestLogger(),
  });

  // ── Centralized Logging & Error Handling ──────────────────────────────
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // ── API version prefix ───────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Cookie parser (for httpOnly refresh token) ───────────────────────
  app.use(cookieParser());

  // ── Helmet — full CSP config ─────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          connectSrc: ["'self'", 'https://api.razorpay.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          frameSrc: ["'self'", 'https://api.razorpay.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // ── CORS — strict whitelist ─────────────────────────────────────────
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      process.env.ADMIN_URL || 'http://localhost:3002',
    ],
    credentials: true, // Required for httpOnly cookie refresh tokens
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global validation pipe ───────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`✅ REVORA API running on port ${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Base: http://localhost:${port}/api/v1`);
}

bootstrap();
