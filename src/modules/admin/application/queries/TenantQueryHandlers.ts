import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { Tenant, TenantStatus } from '../../domain/Tenant';
import type { TenantRepository } from '../../domain/TenantRepository';
import { TENANT_REPOSITORY } from '../../domain/tokens';

// Queries
export class GetTenantByIdQuery {
  constructor(public readonly tenantId: string) {}
}

export class GetTenantBySlugQuery {
  constructor(public readonly slug: string) {}
}

export class GetTenantByEmailQuery {
  constructor(public readonly email: string) {}
}

export class GetTenantByDomainQuery {
  constructor(public readonly domain: string) {}
}

export class GetAllTenantsQuery {
  constructor(
    public readonly status?: TenantStatus,
    public readonly planId?: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}

export class GetTenantAnalyticsQuery {
  constructor(public readonly period?: 'day' | 'week' | 'month' | 'year') {}
}

// Query Handlers
@QueryHandler(GetTenantByIdQuery)
@Injectable()
export class GetTenantByIdQueryHandler
  implements IQueryHandler<GetTenantByIdQuery>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(query: GetTenantByIdQuery): Promise<Tenant | null> {
    return this.tenantRepository.findById(query.tenantId);
  }
}

@QueryHandler(GetTenantBySlugQuery)
@Injectable()
export class GetTenantBySlugQueryHandler
  implements IQueryHandler<GetTenantBySlugQuery>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(query: GetTenantBySlugQuery): Promise<Tenant | null> {
    return this.tenantRepository.findBySlug(query.slug);
  }
}

@QueryHandler(GetTenantByEmailQuery)
@Injectable()
export class GetTenantByEmailQueryHandler
  implements IQueryHandler<GetTenantByEmailQuery>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(query: GetTenantByEmailQuery): Promise<Tenant | null> {
    return this.tenantRepository.findByEmail(query.email);
  }
}

@QueryHandler(GetTenantByDomainQuery)
@Injectable()
export class GetTenantByDomainQueryHandler
  implements IQueryHandler<GetTenantByDomainQuery>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(query: GetTenantByDomainQuery): Promise<Tenant | null> {
    return this.tenantRepository.findByDomain(query.domain);
  }
}

@QueryHandler(GetAllTenantsQuery)
@Injectable()
export class GetAllTenantsQueryHandler
  implements IQueryHandler<GetAllTenantsQuery>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(query: GetAllTenantsQuery): Promise<Tenant[]> {
    return this.tenantRepository.findAll({
      status: query.status,
      planId: query.planId,
      offset: query.page ? (query.page - 1) * (query.limit || 10) : undefined,
      limit: query.limit || 10,
    });
  }
}

@QueryHandler(GetTenantAnalyticsQuery)
@Injectable()
export class GetTenantAnalyticsQueryHandler
  implements IQueryHandler<GetTenantAnalyticsQuery>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(
    _query: GetTenantAnalyticsQuery,
  ): Promise<Record<string, unknown>> {
    return this.tenantRepository.getAnalytics();
  }
}

// Export all handlers
export const TenantQueryHandlers = [
  GetTenantByIdQueryHandler,
  GetTenantBySlugQueryHandler,
  GetTenantByEmailQueryHandler,
  GetTenantByDomainQueryHandler,
  GetAllTenantsQueryHandler,
  GetTenantAnalyticsQueryHandler,
];
