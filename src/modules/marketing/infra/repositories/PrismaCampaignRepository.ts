import { Injectable } from '@nestjs/common';
import {
  Prisma,
  CampaignType as PrismaCampaignType,
  MessageChannel as PrismaMessageChannel,
  CampaignStatus as PrismaCampaignStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import {
  CampaignRepository,
  CampaignFilters,
  CampaignSortOptions,
} from '../../domain/CampaignRepository';
import {
  Campaign,
  CampaignType,
  CampaignStatus,
  MessageChannel,
  ClientSegment,
} from '../../domain/Campaign';

@Injectable()
export class PrismaCampaignRepository implements CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(campaign: Campaign): Promise<void> {
    const data = this.toPrismaData(campaign);

    await this.prisma.campaign.upsert({
      where: { id: campaign.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string, tenantId: string): Promise<Campaign | null> {
    const campaignData = await this.prisma.campaign.findFirst({
      where: { id, tenantId },
    });

    return campaignData ? this.toDomain(campaignData) : null;
  }

  async findByTenant(
    tenantId: string,
    filters?: {
      type?: CampaignType;
      status?: CampaignStatus;
      channel?: MessageChannel;
      search?: string;
    },
    options?: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    },
  ): Promise<Campaign[]> {
    const where: Prisma.CampaignWhereInput = { tenantId };

    if (filters?.type) where.type = filters.type as PrismaCampaignType;
    if (filters?.status) where.status = filters.status as PrismaCampaignStatus;
    if (filters?.channel)
      where.channel = filters.channel as PrismaMessageChannel;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.CampaignOrderByWithRelationInput;
    if (options?.sortBy) {
      const sortField =
        options.sortBy as keyof Prisma.CampaignOrderByWithRelationInput;
      orderBy = {
        [sortField]: options.sortOrder || 'asc',
      } as Prisma.CampaignOrderByWithRelationInput;
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const campaigns = await this.prisma.campaign.findMany({
      where,
      orderBy,
      take: options?.limit,
      skip: options?.offset,
    });

    return campaigns.map((campaign) => this.toDomain(campaign));
  }

  async countByTenant(
    tenantId: string,
    filters?: {
      type?: CampaignType;
      status?: CampaignStatus;
      channel?: MessageChannel;
      search?: string;
    },
  ): Promise<number> {
    const where: Prisma.CampaignWhereInput = { tenantId };

    if (filters?.type) where.type = filters.type as PrismaCampaignType;
    if (filters?.status) where.status = filters.status as PrismaCampaignStatus;
    if (filters?.channel)
      where.channel = filters.channel as PrismaMessageChannel;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.campaign.count({ where });
  }

  async getCampaignStats(tenantId: string): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
  }> {
    const [stats, metrics] = await Promise.all([
      this.prisma.campaign.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      this.prisma.campaign.aggregate({
        where: { tenantId, status: 'COMPLETED' },
        _avg: {
          totalSent: true,
          delivered: true,
          opened: true,
          clicked: true,
          converted: true,
        },
        _sum: {
          totalSent: true,
        },
      }),
    ]);

    const statusCounts = stats.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalSent = metrics._sum.totalSent || 0;
    const avgDelivered = metrics._avg.delivered || 0;
    const avgOpened = metrics._avg.opened || 0;
    const avgClicked = metrics._avg.clicked || 0;
    const avgConverted = metrics._avg.converted || 0;

    return {
      totalCampaigns: Object.values(statusCounts).reduce(
        (sum: number, count: unknown) => sum + Number(count),
        0,
      ),
      activeCampaigns:
        (Number(statusCounts['SENDING']) || 0) +
        (Number(statusCounts['SCHEDULED']) || 0),
      completedCampaigns: Number(statusCounts['COMPLETED']) || 0,
      totalSent,
      avgOpenRate: avgDelivered > 0 ? (avgOpened / avgDelivered) * 100 : 0,
      avgClickRate: avgOpened > 0 ? (avgClicked / avgOpened) * 100 : 0,
      avgConversionRate: avgClicked > 0 ? (avgConverted / avgClicked) * 100 : 0,
    };
  }

  async getRecentCampaigns(
    tenantId: string,
    limit: number = 10,
  ): Promise<Campaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return campaigns.map((campaign) => this.toDomain(campaign));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.campaign.delete({
      where: { id, tenantId },
    });
  }

  async update(campaign: Campaign): Promise<void> {
    const data = this.toPrismaData(campaign);
    delete data.id;

    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data,
    });
  }

  // Missing required methods from CampaignRepository interface
  async findAll(
    tenantId: string,
    filters?: CampaignFilters,
    sort?: CampaignSortOptions,
    pagination?: { page: number; limit: number },
  ): Promise<{
    campaigns: Campaign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.findByTenant(tenantId, filters, {
        sortBy: sort?.field,
        sortOrder: sort?.order,
        limit,
        offset: skip,
      }),
      this.countByTenant(tenantId, filters),
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByStatus(
    status: CampaignStatus,
    tenantId: string,
  ): Promise<Campaign[]> {
    return this.findByTenant(tenantId, { status });
  }

  async findByType(type: CampaignType, tenantId: string): Promise<Campaign[]> {
    return this.findByTenant(tenantId, { type });
  }

  async findScheduledCampaigns(
    beforeDate: Date,
    tenantId: string,
  ): Promise<Campaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        tenantId,
        status: 'SCHEDULED',
        scheduledAt: { lte: beforeDate },
      },
    });
    return campaigns.map((campaign) => this.toDomain(campaign));
  }

  async findOverdueCampaigns(tenantId: string): Promise<Campaign[]> {
    const now = new Date();
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        tenantId,
        status: 'SCHEDULED',
        scheduledAt: { lt: now },
      },
    });
    return campaigns.map((campaign) => this.toDomain(campaign));
  }

  async getCampaignMetrics(
    tenantId: string,
    _dateFrom?: Date,
    _dateTo?: Date,
  ): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalMessagesSent: number;
    averageDeliveryRate: number;
    averageOpenRate: number;
    averageClickRate: number;
    averageConversionRate: number;
  }> {
    // Simple implementation using existing getCampaignStats
    const stats = await this.getCampaignStats(tenantId);
    return {
      totalCampaigns: stats.totalCampaigns,
      activeCampaigns: stats.activeCampaigns,
      completedCampaigns: stats.completedCampaigns,
      totalMessagesSent: stats.totalSent,
      averageDeliveryRate: 95, // Placeholder
      averageOpenRate: stats.avgOpenRate,
      averageClickRate: stats.avgClickRate,
      averageConversionRate: stats.avgConversionRate,
    };
  }

  getTopPerformingCampaigns(
    _tenantId: string,
    _metric: 'deliveryRate' | 'openRate' | 'clickRate' | 'conversionRate',
    _limit?: number,
  ): Promise<Array<{ campaign: Campaign; metricValue: number }>> {
    // Simple implementation - return empty for now
    return Promise.resolve([]);
  }

  getCampaignPerformanceByType(_tenantId: string): Promise<
    Array<{
      type: CampaignType;
      campaignCount: number;
      totalSent: number;
      averageDeliveryRate: number;
      averageOpenRate: number;
      averageClickRate: number;
      averageConversionRate: number;
    }>
  > {
    // Simple implementation - return empty for now
    return Promise.resolve([]);
  }

  getCampaignPerformanceByChannel(_tenantId: string): Promise<
    Array<{
      channel: MessageChannel;
      campaignCount: number;
      totalSent: number;
      averageDeliveryRate: number;
      averageOpenRate: number;
      averageClickRate: number;
      averageConversionRate: number;
    }>
  > {
    // Simple implementation - return empty for now
    return Promise.resolve([]);
  }

  private toPrismaData(
    campaign: Campaign,
  ): Prisma.CampaignUncheckedCreateInput {
    const props = campaign.getProps();
    return {
      id: campaign.id,
      name: props.name,
      description: props.description,
      type: props.type as PrismaCampaignType,
      tenantId: props.tenantId,
      targetSegment: props.targetSegment as unknown as Prisma.InputJsonValue,
      template: props.template,
      variables: props.variables as Prisma.InputJsonValue,
      channel: props.channel as PrismaMessageChannel,
      scheduledAt: props.scheduledAt,
      startDate: props.startDate,
      endDate: props.endDate,
      status: props.status as PrismaCampaignStatus,
      totalSent: props.metrics.totalSent,
      delivered: props.metrics.delivered,
      opened: props.metrics.opened,
      clicked: props.metrics.clicked,
      converted: props.metrics.converted,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  private toDomain(data: Prisma.CampaignGetPayload<object>): Campaign {
    return new Campaign({
      id: data.id,
      name: data.name,
      description: data.description || '',
      type: data.type as CampaignType,
      tenantId: data.tenantId,
      targetSegment: (data.targetSegment as unknown as ClientSegment) || {
        conditions: [],
        logic: 'AND' as const,
      },
      template: data.template || '',
      variables: (data.variables as Record<string, unknown>) || {},
      channel: data.channel as MessageChannel,
      scheduledAt: data.scheduledAt || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      status: data.status as CampaignStatus,
      metrics: {
        totalSent: data.totalSent || 0,
        delivered: data.delivered || 0,
        opened: data.opened || 0,
        clicked: data.clicked || 0,
        converted: data.converted || 0,
      },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
