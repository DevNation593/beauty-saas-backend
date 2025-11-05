import { Injectable } from '@nestjs/common';
import {
  Prisma,
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import { UserRepository } from '../../domain/UserRepository';
import { User, UserRole, UserStatus } from '../../domain/User';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    const data: Prisma.UserUncheckedCreateInput = this.toPrismaData(user);

    await this.prisma.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    const userData = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    const where: Prisma.UserWhereInput = { email: email.toLowerCase() };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const userData = await this.prisma.user.findFirst({ where });
    return userData ? this.toDomain(userData) : null;
  }

  async findByTenant(
    tenantId: string,
    filters?: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    },
    options?: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    },
  ): Promise<User[]> {
    const where: Prisma.UserWhereInput = { tenantId };

    if (filters?.role) {
      where.role = filters.role as PrismaUserRole;
    }

    if (filters?.status) {
      where.status = filters.status as PrismaUserStatus;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (options?.sortBy) {
      (orderBy as Record<string, Prisma.SortOrder>)[options.sortBy] =
        options.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      take: options?.limit,
      skip: options?.offset,
    });

    return users.map((user) => this.toDomain(user));
  }

  async countByTenant(
    tenantId: string,
    filters?: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    },
  ): Promise<number> {
    const where: Prisma.UserWhereInput = { tenantId };

    if (filters?.role) {
      where.role = filters.role as PrismaUserRole;
    }

    if (filters?.status) {
      where.status = filters.status as PrismaUserStatus;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.count({ where });
  }

  async findByResetToken(token: string): Promise<User | null> {
    // Password reset is now managed by Supabase Auth
    // This method is deprecated and should not be used
    console.warn('findByResetToken is deprecated - use Supabase Auth password reset');
    return null;
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    const userData = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async findActiveByRole(tenantId: string, role: UserRole): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: role as PrismaUserRole,
        status: UserStatus.ACTIVE as PrismaUserStatus,
      },
      orderBy: { firstName: 'asc' },
    });

    return users.map((user) => this.toDomain(user));
  }

  async findOwners(tenantId: string): Promise<User[]> {
    return this.findActiveByRole(tenantId, UserRole.OWNER);
  }

  async findByRole(role: UserRole, tenantId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: role as PrismaUserRole,
      },
      orderBy: { firstName: 'asc' },
    });

    return users.map((user) => this.toDomain(user));
  }

  async count(
    tenantId: string,
    filters?: { role?: UserRole; status?: UserStatus; search?: string },
  ): Promise<number> {
    const where: Prisma.UserWhereInput = { tenantId };

    if (filters?.role) {
      where.role = filters.role as PrismaUserRole;
    }

    if (filters?.status) {
      where.status = filters.status as PrismaUserStatus;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.count({ where });
  }

  async getUserStats(tenantId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<UserRole, number>;
    recentLogins: number; // Last 30 days
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, activeUsers, usersByRole, recentLogins] =
      await Promise.all([
        this.prisma.user.count({ where: { tenantId } }),
        this.prisma.user.count({
          where: {
            tenantId,
            status: UserStatus.ACTIVE as PrismaUserStatus,
          },
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          where: { tenantId },
          _count: { role: true },
        }),
        this.prisma.user.count({
          where: {
            tenantId,
            lastLoginAt: {
              gte: thirtyDaysAgo,
            },
          },
        }),
      ]);

    const roleStats = usersByRole.reduce(
      (acc, item) => {
        acc[item.role as UserRole] = item._count.role;
        return acc;
      },
      {} as Record<UserRole, number>,
    );

    // Ensure all roles are present
    Object.values(UserRole).forEach((role) => {
      if (!(role in roleStats)) {
        roleStats[role] = 0;
      }
    });

    return {
      totalUsers,
      activeUsers,
      usersByRole: roleStats,
      recentLogins,
    };
  }

  async getActivityMetrics(tenantId: string, period?: string): Promise<any> {
    // Convert period to dates
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1); // Default to last month
    }

    const [newUsers, activeUsers, loginActivity] = await Promise.all([
      this.prisma.user.count({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          tenantId,
          lastLoginAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      this.prisma.$queryRaw`
        SELECT 
          DATE(last_login_at) as date,
          COUNT(*) as logins
        FROM users 
        WHERE tenant_id = ${tenantId}
          AND last_login_at >= ${startDate}
          AND last_login_at <= ${endDate}
        GROUP BY DATE(last_login_at)
        ORDER BY date ASC
      `,
    ]);

    return {
      newUsers,
      activeUsers,
      loginActivity: (
        loginActivity as Array<{ date: Date; logins: bigint }>
      ).map((item) => ({
        date: item.date,
        logins: Number(item.logins),
      })),
    };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  async update(user: User): Promise<void> {
    const data: Prisma.UserUncheckedUpdateInput = this.toPrismaData(user);

    const { id: _, ...updateData } = data as Prisma.UserUncheckedUpdateInput & {
      id?: string;
    };

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }

  async existsByEmail(email: string, tenantId?: string): Promise<boolean> {
    const where: Prisma.UserWhereInput = { email: email.toLowerCase() };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const count: number = await this.prisma.user.count({ where });
    return count > 0;
  }

  private toPrismaData(user: User): Prisma.UserUncheckedCreateInput {
    const props = user.getProps();
    return {
      id: user.id,
      tenantId: props.tenantId,
      email: props.email,
      firstName: props.firstName,
      lastName: props.lastName,
      phone: props.phone ?? undefined,
      role: props.role as PrismaUserRole,
      status: props.status as PrismaUserStatus,
      avatar: props.avatar ?? undefined,
      preferences: props.preferences as Prisma.InputJsonValue,
      permissions: props.permissions,
      lastLoginAt: props.lastLoginAt ?? undefined,
      emailVerifiedAt: props.emailVerifiedAt ?? undefined,
      phoneVerifiedAt: props.phoneVerifiedAt ?? undefined,
      twoFactorEnabled: props.twoFactorEnabled ?? false,
      timezone: props.timezone ?? 'UTC',
      locale: props.locale ?? 'en',
      // Removed password and reset token fields - managed by Supabase Auth
      emailVerificationToken: props.emailVerificationToken ?? undefined,
      isFirstLogin: props.isFirstLogin ?? false,
      createdAt: props.createdAt ?? undefined,
      updatedAt: props.updatedAt ?? undefined,
    };
  }

  private toDomain(data: Prisma.UserGetPayload<object>): User {
    return new User({
      id: data.id,
      tenantId: data.tenantId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? undefined,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      avatar: data.avatar ?? undefined,
      preferences: (data.preferences as Record<string, unknown>) || {},
      permissions: data.permissions || [],
      lastLoginAt: data.lastLoginAt ?? undefined,
      emailVerifiedAt: data.emailVerifiedAt ?? undefined,
      phoneVerifiedAt: data.phoneVerifiedAt ?? undefined,
      twoFactorEnabled: data.twoFactorEnabled || false,
      timezone: data.timezone || 'UTC',
      locale: data.locale || 'en',
      // Removed password and reset token fields - managed by Supabase Auth
      emailVerificationToken: data.emailVerificationToken ?? undefined,
      isFirstLogin: data.isFirstLogin || false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
