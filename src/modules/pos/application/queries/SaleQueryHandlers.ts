import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import type { SaleRepository, SaleFilters } from '../../domain/SaleRepository';
import { Sale, SaleStatus, PaymentMethod } from '../../domain/Sale';

export class GetSaleByIdQuery {
  constructor(
    public readonly saleId: string,
    public readonly tenantId: string,
  ) {}
}

export class GetSalesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly filters?: {
      clientId?: string;
      staffId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      status?: string;
      paymentMethod?: string;
      minAmount?: number;
      maxAmount?: number;
    },
    public readonly sortBy?: string,
    public readonly sortOrder?: 'asc' | 'desc',
  ) {}
}

export class GetDailySalesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly date: Date = new Date(),
  ) {}
}

export class GetSalesReportQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly groupBy?: 'day' | 'week' | 'month',
  ) {}
}

export class GetTopServicesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly limit: number = 10,
  ) {}
}

export class GetTopProductsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly limit: number = 10,
  ) {}
}

export class GetStaffPerformanceQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly staffId?: string,
  ) {}
}

@Injectable()
@QueryHandler(GetSaleByIdQuery)
export class GetSaleByIdQueryHandler
  implements IQueryHandler<GetSaleByIdQuery>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(query: GetSaleByIdQuery): Promise<Sale | null> {
    return this.saleRepository.findById(query.saleId, query.tenantId);
  }
}

@Injectable()
@QueryHandler(GetSalesQuery)
export class GetSalesQueryHandler implements IQueryHandler<GetSalesQuery> {
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(query: GetSalesQuery): Promise<{
    sales: Sale[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (query.page - 1) * query.limit;

    // Convert filters to proper types
    const filters: SaleFilters | undefined = query.filters
      ? {
          ...query.filters,
          status: query.filters.status
            ? (query.filters.status as SaleStatus)
            : undefined,
          paymentMethod: query.filters.paymentMethod
            ? (query.filters.paymentMethod as PaymentMethod)
            : undefined,
        }
      : undefined;

    const [sales, total] = await Promise.all([
      this.saleRepository.findByTenant(query.tenantId, filters, {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        limit: query.limit,
        offset,
      }),
      this.saleRepository.countByTenant(query.tenantId, filters),
    ]);

    return {
      sales,
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}

@Injectable()
@QueryHandler(GetDailySalesQuery)
export class GetDailySalesQueryHandler
  implements IQueryHandler<GetDailySalesQuery>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(query: GetDailySalesQuery): Promise<{
    totalSales: number;
    totalAmount: number;
    averageTicket: number;
    paymentMethodBreakdown: Record<string, number>;
  }> {
    const startOfDay = new Date(query.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(query.date);
    endOfDay.setHours(23, 59, 59, 999);

    const filters = {
      dateFrom: startOfDay,
      dateTo: endOfDay,
    };

    const [sales, analytics] = await Promise.all([
      this.saleRepository.findByTenant(query.tenantId, filters),
      this.saleRepository.getAnalytics(query.tenantId, startOfDay, endOfDay),
    ]);

    const paymentMethodBreakdown = sales.reduce(
      (acc, sale) => {
        acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalSales: analytics.totalSales,
      totalAmount: analytics.totalRevenue,
      averageTicket: analytics.averageTicket,
      paymentMethodBreakdown,
    };
  }
}

@Injectable()
@QueryHandler(GetSalesReportQuery)
export class GetSalesReportQueryHandler
  implements IQueryHandler<GetSalesReportQuery>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(query: GetSalesReportQuery): Promise<{
    revenue: Array<{ date: string; amount: number; sales: number }>;
    summary: {
      totalRevenue: number;
      totalSales: number;
      averageTicket: number;
      growth: number;
    };
  }> {
    return this.saleRepository.getSalesReport(query.tenantId, {
      from: query.startDate,
      to: query.endDate,
    });
  }
}

@Injectable()
@QueryHandler(GetTopServicesQuery)
export class GetTopServicesQueryHandler
  implements IQueryHandler<GetTopServicesQuery>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(query: GetTopServicesQuery): Promise<
    Array<{
      serviceId: string;
      serviceName: string;
      totalSales: number;
      totalRevenue: number;
      quantity: number;
    }>
  > {
    return this.saleRepository.getTopItems(
      query.tenantId,
      { from: query.startDate, to: query.endDate },
      'SERVICE',
    );
  }
}

@Injectable()
@QueryHandler(GetTopProductsQuery)
export class GetTopProductsQueryHandler
  implements IQueryHandler<GetTopProductsQuery>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(query: GetTopProductsQuery): Promise<
    Array<{
      productId: string;
      productName: string;
      totalSales: number;
      totalRevenue: number;
      quantity: number;
    }>
  > {
    return this.saleRepository.getTopItems(
      query.tenantId,
      { from: query.startDate, to: query.endDate },
      'PRODUCT',
    );
  }
}

@Injectable()
@QueryHandler(GetStaffPerformanceQuery)
export class GetStaffPerformanceQueryHandler
  implements IQueryHandler<GetStaffPerformanceQuery>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(query: GetStaffPerformanceQuery): Promise<
    Array<{
      staffId: string;
      staffName: string;
      totalSales: number;
      totalRevenue: number;
      averageTicket: number;
      commissionsEarned: number;
    }>
  > {
    return this.saleRepository.getStaffPerformance(query.tenantId, {
      from: query.startDate,
      to: query.endDate,
    });
  }
}
