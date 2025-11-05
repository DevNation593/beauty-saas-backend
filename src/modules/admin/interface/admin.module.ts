import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../../common/infra/database/database.module';
import { AdminController } from './admin.controller';
import { PrismaTenantRepository } from '../infra/repositories/PrismaTenantRepository';
import { TENANT_REPOSITORY } from '../domain/tokens';

// Command Handlers
import { TenantCommandHandlers } from '../application/commands/TenantCommandHandlers';

// Query Handlers
import { TenantQueryHandlers } from '../application/queries/TenantQueryHandlers';

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [AdminController],
  providers: [
    ...TenantCommandHandlers,
    ...TenantQueryHandlers,
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository,
    },
  ],
  exports: [TENANT_REPOSITORY],
})
export class AdminModule {}
