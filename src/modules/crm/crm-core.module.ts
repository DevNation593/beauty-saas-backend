import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../common/infra/database/database.module';

// Repository token
import { CLIENT_REPOSITORY } from './domain/client.tokens';

// Repository implementation
import { PrismaClientRepository } from './infra/repositories/PrismaClientRepository';

// Command Handlers
import {
  CreateClientCommandHandler,
  UpdateClientCommandHandler,
  DeleteClientCommandHandler,
  AddClientTagCommandHandler,
  RemoveClientTagCommandHandler,
  UpdateClientSegmentCommandHandler,
} from './application/commands/ClientCommandHandlers';

// Query Handlers
import {
  GetClientQueryHandler,
  GetClientsQueryHandler,
  GetClientByEmailQueryHandler,
  GetClientByPhoneQueryHandler,
  GetClientsBySegmentQueryHandler,
  GetClientsByStatusQueryHandler,
  GetClientsByTagsQueryHandler,
  GetClientAnalyticsQueryHandler,
  GetClientRetentionReportQueryHandler,
  ExportClientsQueryHandler,
} from './application/queries/ClientQueryHandlers';

const CommandHandlers = [
  CreateClientCommandHandler,
  UpdateClientCommandHandler,
  DeleteClientCommandHandler,
  AddClientTagCommandHandler,
  RemoveClientTagCommandHandler,
  UpdateClientSegmentCommandHandler,
];

const QueryHandlers = [
  GetClientQueryHandler,
  GetClientsQueryHandler,
  GetClientByEmailQueryHandler,
  GetClientByPhoneQueryHandler,
  GetClientsBySegmentQueryHandler,
  GetClientsByStatusQueryHandler,
  GetClientsByTagsQueryHandler,
  GetClientAnalyticsQueryHandler,
  GetClientRetentionReportQueryHandler,
  ExportClientsQueryHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [],
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [CLIENT_REPOSITORY],
})
export class CrmCoreModule {}
