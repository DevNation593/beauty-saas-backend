import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserStatus, TenantStatus } from '@prisma/client';
import {
  GetUserProfileQuery,
  GetUserByEmailQuery,
  GetUsersByTenantQuery,
  GetTenantQuery,
  GetTenantBySlugQuery,
  GetTenantsQuery,
} from '../queries/IdentityQueries';
import { PrismaService } from '../../../../common/infra/database/prisma.service';

@Injectable()
@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler
  implements IQueryHandler<GetUserProfileQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserProfileQuery): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id: query.userId },
      include: {
        tenant: {
          include: {
            plan: true,
          },
        },
      },
    });
  }
}

@Injectable()
@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler
  implements IQueryHandler<GetUserByEmailQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserByEmailQuery): Promise<any> {
    const where: Prisma.UserWhereInput = { email: query.email };
    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    return this.prisma.user.findFirst({
      where,
      include: {
        tenant: {
          include: {
            plan: true,
          },
        },
      },
    });
  }
}

@Injectable()
@QueryHandler(GetUsersByTenantQuery)
export class GetUsersByTenantHandler
  implements IQueryHandler<GetUsersByTenantQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUsersByTenantQuery): Promise<any> {
    const { tenantId, page = 1, limit = 20, search, role, status } = query;

    const where: Prisma.UserWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (status) {
      where.status = status as UserStatus;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            include: {
              plan: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

@Injectable()
@QueryHandler(GetTenantQuery)
export class GetTenantHandler implements IQueryHandler<GetTenantQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantQuery): Promise<any> {
    return this.prisma.tenant.findUnique({
      where: { id: query.tenantId },
      include: {
        plan: true,
      },
    });
  }
}

@Injectable()
@QueryHandler(GetTenantBySlugQuery)
export class GetTenantBySlugHandler
  implements IQueryHandler<GetTenantBySlugQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantBySlugQuery): Promise<any> {
    return this.prisma.tenant.findUnique({
      where: { slug: query.slug },
      include: {
        plan: true,
      },
    });
  }
}

@Injectable()
@QueryHandler(GetTenantsQuery)
export class GetTenantsHandler implements IQueryHandler<GetTenantsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantsQuery): Promise<any> {
    const { page = 1, limit = 20, search, status } = query;

    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as TenantStatus;
    }

    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
