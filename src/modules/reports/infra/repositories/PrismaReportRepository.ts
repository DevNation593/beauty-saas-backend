import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import { ReportFilters, ReportRepository } from '../../domain/ReportRepository';
import { Report, ReportType, ReportStatus } from '../../domain/Report';

@Injectable()
export class PrismaReportRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}
  update(_report: Report): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findAll(
    _tenantId: string,
    _filters?: ReportFilters,
    _pagination?: { page: number; limit: number },
  ): Promise<{
    reports: Report[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    throw new Error('Method not implemented.');
  }
  findByType(_type: ReportType, _tenantId: string): Promise<Report[]> {
    throw new Error('Method not implemented.');
  }
  findScheduledReports(_tenantId: string): Promise<Report[]> {
    throw new Error('Method not implemented.');
  }
  findOverdueReports(_tenantId: string): Promise<Report[]> {
    throw new Error('Method not implemented.');
  }
  findRecentReports(_tenantId: string, _limit?: number): Promise<Report[]> {
    throw new Error('Method not implemented.');
  }

  async save(report: Report): Promise<void> {
    const data = this.toPrismaData(report);

    await this.prisma.report.upsert({
      where: { id: report.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string, tenantId: string): Promise<Report | null> {
    const reportData = await this.prisma.report.findFirst({
      where: { id, tenantId },
    });

    return reportData ? this.toDomain(reportData) : null;
  }

  async findByTenant(
    tenantId: string,
    filters?: {
      type?: ReportType;
      status?: ReportStatus;
      search?: string;
    },
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Report[]> {
    const where: Prisma.ReportWhereInput = { tenantId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return reports.map((report) => this.toDomain(report));
  }

  async generateSalesReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    return this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sales_count,
        SUM(total) as total_revenue,
        AVG(total) as avg_ticket
      FROM sales 
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
  }

  async generateClientReport(
    tenantId: string,
    startDate: Date,
    _endDate: Date,
  ): Promise<any> {
    return this.prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN created_at >= ${startDate} THEN 1 END) as new_clients,
        COUNT(CASE WHEN last_visit >= ${startDate} THEN 1 END) as active_clients
      FROM clients 
      WHERE tenant_id = ${tenantId}
    `;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.report.delete({
      where: { id, tenantId },
    });
  }

  private toPrismaData(report: Report): Prisma.ReportUncheckedCreateInput {
    const props = report.getProps();
    return {
      id: report.id,
      name: props.name,
      description: props.description,
      type: props.type,
      tenantId: props.tenantId,
      parameters: props.parameters,
      data: props.data as Prisma.InputJsonValue,
      status: props.status,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  private toDomain(
    data: Prisma.ReportGetPayload<Record<string, never>>,
  ): Report {
    return new Report({
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      type: data.type as ReportType,
      tenantId: data.tenantId,
      filters: (data.filters as Record<string, unknown>) || {},
      format: data.format as 'PDF' | 'EXCEL' | 'CSV' | 'JSON',
      status: data.status as ReportStatus,
      parameters: (data.parameters as Record<string, any>) || {},
      data: data.data as unknown,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
