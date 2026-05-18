import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { KycModule } from './modules/kyc/kyc.module';
import { FabricsModule } from './modules/fabrics/fabrics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { SearchModule } from './modules/search/search.module';
import { LoggerModule } from 'nestjs-pino';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    // ── Global config (reads .env) ─────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Rate limiting ─────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short',   ttl: 60000,  limit: 5   }, // auth: 5 req/min
      { name: 'default', ttl: 60000,  limit: 100 }, // api:  100 req/min
      { name: 'long',    ttl: 3600000, limit: 1000 }, // hourly
    ]),

    // ── Scheduling ────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Queue Architecture (Redis) ────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        connection: {
          url: config.get('REDIS_URL'),
        },
      }),
    }),

    // ── Global Caching (Redis) ────────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          url: config.get('REDIS_URL'),
        }),
      }),
    }),

    // ── Redis Connection Module ───────────────────────────────────────
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),

    // ── Centralized Logging (Pino) ────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        autoLogging: false,
      },
    }),

    // ── Feature modules ───────────────────────────────────────────────
    PrismaModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    KycModule,
    FabricsModule,
    NotificationsModule,
    HealthModule,
    SearchModule,
  ],
})
export class AppModule {}
