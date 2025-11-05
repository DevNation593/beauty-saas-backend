import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../common/infra/database/database.module';

// Infrastructure
import { PrismaClientRepository } from './infra/repositories/PrismaClientRepository';

// Handlers are registered in `crm-core.module.ts`

// Domain
// Repository token
import { CLIENT_REPOSITORY } from './domain/client.tokens';

// Handlers moved to crm-core.module.ts

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [],
  providers: [
    // Repository implementations
    {
      provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository,
    },
  ],
  exports: [CLIENT_REPOSITORY],
})
export class CrmModule {}
