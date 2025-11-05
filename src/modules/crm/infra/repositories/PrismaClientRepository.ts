import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import { Client, ClientSegment, ClientStatus } from '../../domain/Client';
import {
  ClientRepository,
  ClientFilters,
  ClientSortOptions,
} from '../../domain/ClientRepository';
import type { Decimal } from '@prisma/client/runtime/library';
import type {
  ClientStatus as PrismaClientStatus,
  Gender,
} from '@prisma/client';

interface PrismaClientData {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: Gender | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tenantId: string;
  notes: string | null;
  allergies: string | null;
  preferences: Prisma.JsonValue; // JSON field
  tags: string[];
  allowEmail: boolean;
  allowSms: boolean;
  allowWhatsapp: boolean;
  totalVisits: number;
  totalSpent: Decimal;
  averageTicket: Decimal;
  lastVisit: Date | null;
  status: PrismaClientStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(client: Client): Promise<void> {
    await this.prisma.client.create({
      data: {
        id: client.id,
        tenantId: client.tenantId,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.dateOfBirth,
        address: client.address,
        city: client.city,
        country: client.country,
        status: client.status,
        notes: client.notes,
        tags: client.tags,
        preferences: client.preferences as Prisma.InputJsonValue,
        lastVisit: client.lastVisit,
        totalSpent: client.totalSpent,
        totalVisits: client.visitCount,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
    });
  }

  async update(client: Client): Promise<void> {
    await this.prisma.client.update({
      where: { id: client.id, tenantId: client.tenantId },
      data: {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.dateOfBirth,
        address: client.address,
        city: client.city,
        country: client.country,
        status: client.status,
        notes: client.notes,
        tags: client.tags,
        preferences: client.preferences as Prisma.InputJsonValue,
        lastVisit: client.lastVisit,
        totalSpent: client.totalSpent,
        totalVisits: client.visitCount,
        updatedAt: client.updatedAt,
      },
    });
  }

  async findById(id: string, tenantId: string): Promise<Client | null> {
    const clientData = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!clientData) return null;

    return this.toDomain(clientData);
  }

  async findByEmail(email: string, tenantId: string): Promise<Client | null> {
    const clientData = await this.prisma.client.findFirst({
      where: { email, tenantId },
    });

    if (!clientData) return null;

    return this.toDomain(clientData);
  }

  async findByPhone(phone: string, tenantId: string): Promise<Client | null> {
    const clientData = await this.prisma.client.findFirst({
      where: { phone, tenantId },
    });

    if (!clientData) return null;

    return this.toDomain(clientData);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.client.delete({
      where: { id: id, tenantId: tenantId },
    });
  }

  async findAll(
    tenantId: string,
    filters?: ClientFilters,
    sort?: ClientSortOptions,
    pagination?: { page: number; limit: number },
  ): Promise<{
    clients: Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: Record<string, any> = { tenantId };

    // Apply filters
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.segment) {
      where.segment = filters.segment;
    }

    if (filters?.hasEmail !== undefined) {
      where.email = filters.hasEmail ? { not: null } : null;
    }

    if (filters?.hasPhone !== undefined) {
      where.phone = filters.hasPhone ? { not: null } : null;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasEvery: filters.tags };
    }

    if (filters?.lastVisitFrom) {
      where.lastVisit = { gte: filters.lastVisitFrom };
    }

    if (filters?.lastVisitTo) {
      where.lastVisit = {
        ...(where.lastVisit as Record<string, unknown>),
        lte: filters.lastVisitTo,
      };
    }

    // Sorting
    const orderBy: Record<string, string> = {};
    if (sort && sort.field && sort.order) {
      orderBy[sort.field] = sort.order;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      clients: clients.map((client) => this.toDomain(client)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySegment(
    segment: ClientSegment,
    tenantId: string,
  ): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: { segment, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => this.toDomain(client));
  }

  async findByStatus(
    status: ClientStatus,
    tenantId: string,
  ): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: { status, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => this.toDomain(client));
  }

  async findByTags(tags: string[], tenantId: string): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        tenantId,
        tags: { hasEvery: tags },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => this.toDomain(client));
  }

  async getClientAnalytics(tenantId: string): Promise<{
    totalClients: number;
    activeClients: number;
    newClientsThisMonth: number;
    averageLifetimeValue: number;
    segmentDistribution: Record<ClientSegment, number>;
    topSpenders: Array<{ client: Client; totalSpent: number }>;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalClients,
      activeClients,
      newClientsThisMonth,
      averageLifetimeValue,
      segmentDistribution,
      topSpenders,
    ] = await Promise.all([
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.client.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.client.aggregate({
        where: { tenantId },
        _avg: { totalSpent: true },
      }),
      this.prisma.client.groupBy({
        by: ['segment'],
        where: { tenantId },
        _count: { segment: true },
      }),
      this.prisma.client.findMany({
        where: { tenantId },
        orderBy: { totalSpent: 'desc' },
        take: 10,
      }),
    ]);

    const segmentDistributionMap: Record<ClientSegment, number> = {
      REGULAR: 0,
      VIP: 0,
      PREMIUM: 0,
      NEW: 0,
      LOYAL: 0,
      AT_RISK: 0,
    };

    segmentDistribution.forEach((item) => {
      segmentDistributionMap[item.segment as ClientSegment] =
        item._count.segment;
    });

    return {
      totalClients,
      activeClients,
      newClientsThisMonth,
      averageLifetimeValue: Number(averageLifetimeValue._avg.totalSpent) || 0,
      segmentDistribution: segmentDistributionMap,
      topSpenders: topSpenders.map((client) => ({
        client: this.toDomain(client),
        totalSpent: client.totalSpent.toNumber(),
      })),
    };
  }

  getRetentionReport(_tenantId: string): Promise<
    Array<{
      month: Date;
      newClients: number;
      returningClients: number;
      retentionRate: number;
    }>
  > {
    // This would require more complex SQL queries
    // For now, returning empty array - implement based on specific requirements
    return Promise.resolve([]);
  }

  async exportClients(
    tenantId: string,
    filters?: ClientFilters,
  ): Promise<Client[]> {
    const where: Record<string, any> = { tenantId };

    // Apply same filters as findAll
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status) where.status = filters.status;
    if (filters?.segment) where.segment = filters.segment;

    const clients = await this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => this.toDomain(client));
  }

  async findByTenant(
    tenantId: string,
    filters?: ClientFilters,
  ): Promise<Client[]> {
    const where: Record<string, any> = { tenantId };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.segment) where.segment = filters.segment;
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasEvery: filters.tags };
      }
      if (filters.city) where.city = filters.city;
    }

    const clients = await this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => this.toDomain(client));
  }

  async search(query: string, tenantId: string): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((client) => this.toDomain(client));
  }

  async count(tenantId: string, filters?: ClientFilters): Promise<number> {
    const where: Record<string, any> = { tenantId };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.segment) where.segment = filters.segment;
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasEvery: filters.tags };
      }
      if (filters.city) where.city = filters.city;
    }

    return this.prisma.client.count({ where });
  }

  private toDomain(clientData: PrismaClientData): Client {
    return new Client({
      id: clientData.id,
      tenantId: clientData.tenantId,
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email || undefined,
      phone: clientData.phone || undefined,
      dateOfBirth: clientData.dateOfBirth || undefined,
      address: clientData.address || undefined,
      city: clientData.city || undefined,
      state: undefined, // Not in current schema
      zipCode: undefined, // Not in current schema
      country: clientData.country || undefined,
      status: clientData.status as ClientStatus,
      segment: ClientSegment.REGULAR, // Default as not in current schema
      notes: clientData.notes || undefined,
      tags: clientData.tags,
      preferences: clientData.preferences as Record<string, unknown>,
      marketingConsent: clientData.allowEmail, // Map to closest equivalent
      referredBy: undefined, // Not in current schema
      lastVisit: clientData.lastVisit || undefined,
      totalSpent: Number(clientData.totalSpent),
      visitCount: clientData.totalVisits,
      createdAt: clientData.createdAt,
      updatedAt: clientData.updatedAt,
    });
  }
}
