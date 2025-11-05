import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Config imports
import appConfig from '../config/app.config';
import databaseConfig from '../config/database.config';
import cacheConfig from '../config/cache.config';
import featuresConfig from '../config/features.config';
import plansConfig from '../config/plans.config';
import supabaseConfig from '../config/supabase.config';

// Common modules
import { DatabaseModule } from './common/infra/database/database.module';
import { SupabaseModule } from './common/infra/supabase/supabase.module';
import { StorageModule } from './common/infra/storage/storage.module';
import { TenantContextMiddleware } from './common/auth/tenancy/tenant-context.middleware';
import { TenantProvider } from './common/auth/tenancy/tenant.provider';
import { GlobalExceptionFilter } from './common/http/filters/global-exception.filter';
import { TransformInterceptor } from './common/http/interceptors/transform.interceptor';

// Feature modules
import { IdentityTenancyModule } from './modules/identity-tenancy/interface/identity-tenancy.module';
import { AgendaModule } from './modules/agenda/interface/agenda.module';
import { AdminModule } from './modules/admin/interface/admin.module';

// API modules
import { ApiGraphQLModule } from './api/graphql/graphql.module';
import { RestApiModule } from './api/rest/rest.module';
import { WebhooksApiModule } from './api/webhooks/webhooks.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        cacheConfig,
        featuresConfig,
        plansConfig,
        supabaseConfig,
      ],
      envFilePath: ['.env', '.env.local'],
    }),

    // Throttling
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl: (configService.get('app.throttleTtl') as number) * 1000, // Convert to ms
          limit: configService.get('app.throttleLimit') as number,
        },
      ],
      inject: [ConfigService],
    }),

    // Cache
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get('cache.redis.host') as string,
        port: configService.get('cache.redis.port') as number,
        password: configService.get('cache.redis.password') as string,
        db: configService.get('cache.redis.db') as number,
        ttl: configService.get('cache.ttl.default') as number,
      }),
      inject: [ConfigService],
    }),

    // Infrastructure
    DatabaseModule,
    SupabaseModule,
    StorageModule,

    // Feature modules
    IdentityTenancyModule,
    AgendaModule,
    AdminModule,

    // API modules
    ApiGraphQLModule,
    RestApiModule,
    WebhooksApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantProvider,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
