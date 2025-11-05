import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { Client, ClientSegment, ClientStatus } from '../../domain/Client';
import type {
  ClientRepository,
  ClientFilters,
  ClientSortOptions,
} from '../../domain/ClientRepository';
import { CLIENT_REPOSITORY } from '../../domain/client.tokens';

export class GetClientQuery {
  constructor(
    public readonly clientId: string,
    public readonly tenantId: string,
  ) {}
}

export class GetClientsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filters?: ClientFilters,
    public readonly sort?: ClientSortOptions,
    public readonly pagination?: { page: number; limit: number },
  ) {}
}

export class GetClientByEmailQuery {
  constructor(
    public readonly email: string,
    public readonly tenantId: string,
  ) {}
}

export class GetClientByPhoneQuery {
  constructor(
    public readonly phone: string,
    public readonly tenantId: string,
  ) {}
}

export class GetClientsBySegmentQuery {
  constructor(
    public readonly segment: ClientSegment,
    public readonly tenantId: string,
  ) {}
}

export class GetClientsByStatusQuery {
  constructor(
    public readonly status: ClientStatus,
    public readonly tenantId: string,
  ) {}
}

export class GetClientsByTagsQuery {
  constructor(
    public readonly tags: string[],
    public readonly tenantId: string,
  ) {}
}

export class GetClientAnalyticsQuery {
  constructor(public readonly tenantId: string) {}
}

export class GetClientRetentionReportQuery {
  constructor(public readonly tenantId: string) {}
}

export class ExportClientsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filters?: ClientFilters,
  ) {}
}

@Injectable()
@QueryHandler(GetClientQuery)
export class GetClientQueryHandler implements IQueryHandler<GetClientQuery> {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientQuery): Promise<Client | null> {
    return this.clientRepository.findById(query.clientId, query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetClientsQuery)
export class GetClientsQueryHandler implements IQueryHandler<GetClientsQuery> {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientsQuery): Promise<{
    clients: Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.clientRepository.findAll(
      query.tenantId,
      query.filters,
      query.sort,
      query.pagination,
    );
  }
}

@Injectable()
@QueryHandler(GetClientByEmailQuery)
export class GetClientByEmailQueryHandler
  implements IQueryHandler<GetClientByEmailQuery>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientByEmailQuery): Promise<Client | null> {
    return this.clientRepository.findByEmail(query.email, query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetClientByPhoneQuery)
export class GetClientByPhoneQueryHandler
  implements IQueryHandler<GetClientByPhoneQuery>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientByPhoneQuery): Promise<Client | null> {
    return this.clientRepository.findByPhone(query.phone, query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetClientsBySegmentQuery)
export class GetClientsBySegmentQueryHandler
  implements IQueryHandler<GetClientsBySegmentQuery>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientsBySegmentQuery): Promise<Client[]> {
    return this.clientRepository.findBySegment(query.segment, query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetClientsByStatusQuery)
export class GetClientsByStatusQueryHandler
  implements IQueryHandler<GetClientsByStatusQuery>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientsByStatusQuery): Promise<Client[]> {
    return this.clientRepository.findByStatus(query.status, query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetClientsByTagsQuery)
export class GetClientsByTagsQueryHandler
  implements IQueryHandler<GetClientsByTagsQuery>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientsByTagsQuery): Promise<Client[]> {
    return this.clientRepository.findByTags(query.tags, query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetClientAnalyticsQuery)
export class GetClientAnalyticsQueryHandler
  implements IQueryHandler<GetClientAnalyticsQuery>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientAnalyticsQuery): Promise<{
    totalClients: number;
    activeClients: number;
    newClientsThisMonth: number;
    averageLifetimeValue: number;
    segmentDistribution: Record<ClientSegment, number>;
    topSpenders: Array<{ client: Client; totalSpent: number }>;
  }> {
    return this.clientRepository.getClientAnalytics(query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetClientRetentionReportQuery)
export class GetClientRetentionReportQueryHandler
  implements IQueryHandler<GetClientRetentionReportQuery>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: GetClientRetentionReportQuery): Promise<
    Array<{
      month: Date;
      newClients: number;
      returningClients: number;
      retentionRate: number;
    }>
  > {
    return this.clientRepository.getRetentionReport(query.tenantId);
  }
}

@Injectable()
@QueryHandler(ExportClientsQuery)
export class ExportClientsQueryHandler
  implements IQueryHandler<ExportClientsQuery>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(query: ExportClientsQuery): Promise<Client[]> {
    return this.clientRepository.exportClients(query.tenantId, query.filters);
  }
}
