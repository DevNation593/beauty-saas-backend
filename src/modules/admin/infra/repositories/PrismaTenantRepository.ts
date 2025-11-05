/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import {
  asRecord,
  getString,
  getNumber,
  getDateFromUnknown,
} from '../../../../common/utils/safe';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import { TenantRepository } from '../../domain/TenantRepository';
import { Tenant, TenantProps, TenantStatus } from '../../domain/Tenant';

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private prisma: PrismaService) {}

  async create(tenant: Tenant): Promise<Tenant> {
    const props = tenant.getProps();
    const data = await this.prisma.tenant.create({
      data: {
        id: props.id,
        name: props.name,
        slug: props.slug,
        email: props.email,
        phone: props.phone,
        address: props.address,
        city: props.city,
        state: props.state,
        country: props.country,
        domain: props.domain,
        timezone: props.timezone,
        currency: 'USD', // Default currency
        locale: props.locale,
        planId: props.planId,
        status: props.status,
        subscriptionStartDate: props.subscriptionStartDate,
        subscriptionEndDate: props.subscriptionEndDate,
        trialEndDate: props.trialEndDate,
        maxUsers: props.maxUsers,
        maxClients: props.maxClients,
        maxLocations: props.maxLocations,
        features: props.features,
        logoUrl: props.logoUrl,
        billingEmail: props.billingEmail,
        taxId: props.taxId,
        isActive: props.isActive,
        settings: props.settings as any,
      },
      include: {
        plan: true,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<Tenant | null> {
    const data = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const data = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        plan: true,
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByEmail(email: string): Promise<Tenant | null> {
    const data = await this.prisma.tenant.findUnique({
      where: { email },
      include: {
        plan: true,
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const data = await this.prisma.tenant.findUnique({
      where: { domain },
      include: {
        plan: true,
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(filters?: {
    status?: TenantStatus;
    planId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Tenant[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.planId) {
      where.planId = filters.planId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const data = await this.prisma.tenant.findMany({
      where,
      include: {
        plan: true,
      },
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((d) => this.toDomain(d));
  }

  async update(tenant: Tenant): Promise<Tenant> {
    const props = tenant.getProps();
    const data = await this.prisma.tenant.update({
      where: { id: props.id },
      data: {
        name: props.name,
        slug: props.slug,
        email: props.email,
        phone: props.phone,
        address: props.address,
        city: props.city,
        state: props.state,
        country: props.country,
        domain: props.domain,
        timezone: props.timezone,
        locale: props.locale,
        planId: props.planId,
        status: props.status,
        subscriptionStartDate: props.subscriptionStartDate,
        subscriptionEndDate: props.subscriptionEndDate,
        trialEndDate: props.trialEndDate,
        maxUsers: props.maxUsers,
        maxClients: props.maxClients,
        maxLocations: props.maxLocations,
        features: props.features,
        logoUrl: props.logoUrl,
        billingEmail: props.billingEmail,
        taxId: props.taxId,
        isActive: props.isActive,
        settings: props.settings as any,
      },
      include: {
        plan: true,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({
      where: { id },
    });
  }

  async count(filters?: {
    status?: TenantStatus;
    planId?: string;
  }): Promise<number> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.planId) {
      where.planId = filters.planId;
    }

    return this.prisma.tenant.count({ where });
  }

  async getAnalytics(): Promise<{
    total: number;
    byStatus: Record<TenantStatus, number>;
    byPlan: Record<string, number>;
    trialExpiring: number;
    subscriptionExpiring: number;
  }> {
    const [total, byStatus, byPlan, trialExpiring, subscriptionExpiring] =
      await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.tenant.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.prisma.tenant.groupBy({
          by: ['planId'],
          _count: true,
        }),
        this.prisma.tenant.count({
          where: {
            status: 'TRIAL',
            trialEndDate: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
          },
        }),
        this.prisma.tenant.count({
          where: {
            status: 'ACTIVE',
            subscriptionEndDate: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
          },
        }),
      ]);

    return {
      total,
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status as TenantStatus] = item._count;
          return acc;
        },
        {} as Record<TenantStatus, number>,
      ),
      byPlan: byPlan.reduce(
        (acc, item) => {
          acc[item.planId] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      trialExpiring,
      subscriptionExpiring,
    };
  }

  private toDomain(data: unknown): Tenant {
    const d = asRecord(data);

    const props: TenantProps = {
      id: getString(d, 'id') || '',
      name: getString(d, 'name') || '',
      slug: getString(d, 'slug') || '',
      email: getString(d, 'email') || '',
      phone: getString(d, 'phone') || undefined,
      address: getString(d, 'address') || undefined,
      city: getString(d, 'city') || undefined,
      state: getString(d, 'state') || undefined,
      country: getString(d, 'country') || undefined,
      planId: getString(d, 'planId') || undefined,
      status: (d.status as TenantStatus) || TenantStatus.SUSPENDED,
      domain: getString(d, 'domain') || undefined,
      timezone: getString(d, 'timezone') || 'UTC',
      locale: getString(d, 'locale') || 'en',
      subscriptionStartDate: getDateFromUnknown(d.subscriptionStartDate),
      subscriptionEndDate: getDateFromUnknown(d.subscriptionEndDate),
      trialEndDate: getDateFromUnknown(d.trialEndDate),
      maxUsers: getNumber(d, 'maxUsers') || 0,
      maxClients: getNumber(d, 'maxClients') || 0,
      maxLocations: getNumber(d, 'maxLocations') || 0,
      features: Array.isArray(d.features) ? (d.features as string[]) : [],
      logoUrl: getString(d, 'logoUrl') || undefined,
      billingEmail: getString(d, 'billingEmail') || undefined,
      taxId: getString(d, 'taxId') || undefined,
      isActive: Boolean(d.isActive),
      settings:
        typeof d.settings === 'object' && d.settings !== null
          ? (d.settings as Record<string, unknown>)
          : {},
      createdAt: getDateFromUnknown(d.createdAt),
      updatedAt: getDateFromUnknown(d.updatedAt),
    };

    return new Tenant(props);
  }
}
