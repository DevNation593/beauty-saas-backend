import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AdminModule } from '../../modules/admin/interface/admin.module';
import { IdentityTenancyModule } from '../../modules/identity-tenancy/interface/identity-tenancy.module';
import { AgendaModule } from '../../modules/agenda/interface/agenda.module';
import { CrmCoreModule } from '../../modules/crm/crm-core.module';
import { InventoryCoreModule } from '../../modules/inventory/inventory-core.module';
import { PosCoreModule } from '../../modules/pos/pos-core.module';

// REST API components
import { ApiDocumentationController } from './controllers/api-documentation.controller';
import { RestAdminController } from './controllers/rest-admin.controller';
import { RestIdentityController } from './controllers/rest-identity.controller';
import { RestAppointmentController } from './controllers/rest-appointment.controller';
import { RestCrmController } from './controllers/rest-crm.controller';
import { RestInventoryController } from './controllers/rest-inventory.controller';
import { RestPosController } from './controllers/rest-pos.controller';
import { SupabaseAuthController } from './controllers/supabase-auth.controller';
import { ApiVersioningMiddleware } from './middleware/api-versioning.middleware';
import { ApiRateLimitMiddleware } from './middleware/api-rate-limit.middleware';
import { RestResponseInterceptor } from './interceptors/rest-response.interceptor';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    AdminModule,
    IdentityTenancyModule,
    AgendaModule,
    CrmCoreModule,
    InventoryCoreModule,
    PosCoreModule,
  ],
  controllers: [
    ApiDocumentationController,
    RestAdminController,
    RestIdentityController,
    RestAppointmentController,
    RestCrmController,
    RestInventoryController,
    RestPosController,
    SupabaseAuthController,
  ],
  providers: [
    ApiVersioningMiddleware,
    ApiRateLimitMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: RestResponseInterceptor,
    },
  ],
  exports: [ApiVersioningMiddleware, ApiRateLimitMiddleware],
})
export class RestApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiVersioningMiddleware)
      .forRoutes('*')
      .apply(ApiRateLimitMiddleware)
      .forRoutes('api/*path');
  }
}
