import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import type { UserRepository } from '../../domain/UserRepository';
import { User, UserRole, UserStatus } from '../../domain/User';

export class GetUserByIdQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}

export class GetUsersQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly filters?: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    },
    public readonly sortBy?: string,
    public readonly sortOrder?: 'asc' | 'desc',
  ) {}
}

export class GetUserStatsQuery {
  constructor(public readonly tenantId: string) {}
}

export class GetUsersByRoleQuery {
  constructor(
    public readonly tenantId: string,
    public readonly role: UserRole,
  ) {}
}

export class GetUserActivityQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}
}

@Injectable()
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User | null> {
    return this.userRepository.findById(query.userId, query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetUsersQuery)
export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (query.page - 1) * query.limit;

    const [users, total] = await Promise.all([
      this.userRepository.findByTenant(query.tenantId, query.filters, {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        limit: query.limit,
        offset,
      }),
      this.userRepository.countByTenant(query.tenantId, query.filters),
    ]);

    return {
      users,
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}

@Injectable()
@QueryHandler(GetUserStatsQuery)
export class GetUserStatsQueryHandler
  implements IQueryHandler<GetUserStatsQuery>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserStatsQuery): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<UserRole, number>;
    recentLogins: number;
  }> {
    return this.userRepository.getUserStats(query.tenantId) as any;
  }
}

@Injectable()
@QueryHandler(GetUsersByRoleQuery)
export class GetUsersByRoleQueryHandler
  implements IQueryHandler<GetUsersByRoleQuery>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersByRoleQuery): Promise<User[]> {
    return this.userRepository.findActiveByRole(query.tenantId, query.role);
  }
}

@Injectable()
@QueryHandler(GetUserActivityQuery)
export class GetUserActivityQueryHandler
  implements IQueryHandler<GetUserActivityQuery>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserActivityQuery): Promise<{
    newUsers: number;
    activeUsers: number;
    loginActivity: Array<{ date: string; logins: number }>;
  }> {
    // Calculate period from date range
    const diffTime = Math.abs(
      query.endDate.getTime() - query.startDate.getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let period = 'month';
    if (diffDays <= 7) period = 'week';
    else if (diffDays <= 31) period = 'month';
    else period = 'year';

    return this.userRepository.getActivityMetrics(
      query.tenantId,
      period,
    ) as any;
  }
}
