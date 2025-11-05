import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import { Sale, SaleStatus, PaymentMethod, SaleType } from '../../domain/Sale';
import {
  SaleRepository,
  SaleFilters,
  SaleSortOptions,
  DateRange,
} from '../../domain/SaleRepository';
import type { Decimal } from '@prisma/client/runtime/library';
import type {
  SaleStatus as PrismaSaleStatus,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus,
} from '@prisma/client';

interface PrismaSaleItemData {
  id: string;
  saleId: string;
  serviceId: string | null;
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: Decimal;
  discount: Decimal;
  total: Decimal;
}

interface PrismaSaleData {
  id: string;
  number: string;
  tenantId: string;
  clientId: string | null;
  staffId: string;
  appointmentId: string | null;
  subtotal: Decimal;
  taxAmount: Decimal;
  discount: Decimal;
  tip: Decimal;
  total: Decimal;
  paymentMethod: PrismaPaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: Date | null;
  notes: string | null;
  status: PrismaSaleStatus;
  createdAt: Date;
  updatedAt: Date;
  items: PrismaSaleItemData[];
}

@Injectable()
export class PrismaSaleRepository implements SaleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(sale: Sale): Promise<void> {
    await this.prisma.sale.create({
      data: {
        id: sale.id,
        number: `SALE-${Date.now()}`, // Generate a sale number
        tenantId: sale.tenantId,
        clientId: sale.clientId,
        staffId: sale.staffId,
        status: sale.status as PrismaSaleStatus,
        subtotal: sale.subtotal,
        discount: sale.discount,
        taxAmount: sale.tax,
        tip: sale.tip,
        total: sale.total,
        paymentMethod: sale.paymentMethod as PrismaPaymentMethod,
        notes: sale.notes,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
        items: {
          create: sale.items.map((item) => ({
            id: item.id,
            type: item.type,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
          })),
        },
      },
    });
  }

  async update(sale: Sale): Promise<void> {
    // Delete existing items and recreate them (simpler than complex updates)
    await this.prisma.saleItem.deleteMany({
      where: { saleId: sale.id },
    });

    await this.prisma.sale.update({
      where: { id: sale.id, tenantId: sale.tenantId },
      data: {
        clientId: sale.clientId,
        staffId: sale.staffId,
        status: this.mapDomainStatusToPrisma(sale.status),
        subtotal: sale.subtotal,
        discount: sale.discount,
        taxAmount: sale.tax,
        tip: sale.tip,
        total: sale.total,
        paymentMethod: this.mapDomainPaymentMethodToPrisma(sale.paymentMethod),
        notes: sale.notes,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
        items: {
          create: sale.items.map((item) => ({
            id: item.id,
            type: item.type,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
          })),
        },
      },
    });
  }

  async findById(id: string, tenantId: string): Promise<Sale | null> {
    const saleData = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        client: true,
        staff: true,
      },
    });

    if (!saleData) return null;

    return this.toDomain(saleData);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.sale.delete({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });
  }

  async findAll(
    tenantId: string,
    filters?: SaleFilters,
    sort?: SaleSortOptions,
    pagination?: { page: number; limit: number },
  ): Promise<{
    sales: Sale[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: Prisma.SaleWhereInput = { tenantId };

    // Apply filters
    if (filters?.status) {
      where.status = filters.status as PrismaSaleStatus;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.staffId) {
      where.staffId = filters.staffId;
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod as PrismaPaymentMethod;
    }

    if (filters?.dateFrom) {
      where.createdAt = { gte: filters.dateFrom };
    }

    if (filters?.dateTo) {
      if (where.createdAt && typeof where.createdAt === 'object') {
        where.createdAt = { ...where.createdAt, lte: filters.dateTo };
      } else {
        where.createdAt = { lte: filters.dateTo };
      }
    }

    if (filters?.totalMin) {
      where.total = { gte: filters.totalMin };
    }

    if (filters?.totalMax) {
      if (where.total && typeof where.total === 'object') {
        where.total = { ...where.total, lte: filters.totalMax };
      } else {
        where.total = { lte: filters.totalMax };
      }
    }

    // Apply sorting
    const orderBy: Prisma.SaleOrderByWithRelationInput = {};
    if (sort) {
      (orderBy as Record<string, Prisma.SortOrder>)[sort.field] = sort.order;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          items: true,
          client: true,
          staff: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      sales: sales.map((sale) => this.toDomain(sale)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByClient(clientId: string, tenantId: string): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      where: { clientId, tenantId },
      include: {
        items: true,
        client: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sales.map((sale) => this.toDomain(sale));
  }

  async findByStaff(staffId: string, tenantId: string): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      where: { staffId, tenantId },
      include: {
        items: true,
        client: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sales.map((sale) => this.toDomain(sale));
  }

  async findByStatus(status: SaleStatus, tenantId: string): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      where: { status: this.mapDomainStatusToPrisma(status), tenantId },
      include: {
        items: true,
        client: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sales.map((sale) => this.toDomain(sale));
  }

  async findByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
        client: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sales.map((sale) => this.toDomain(sale));
  }

  async findByTenant(
    tenantId: string,
    filters?: SaleFilters,
    options?: { page: number; limit: number },
  ): Promise<Sale[]> {
    // This is already implemented as findAll, but adapting the interface
    const result = await this.findAll(tenantId, filters, undefined, options);
    return result.sales;
  }

  async findByAppointment(
    appointmentId: string,
    tenantId: string,
  ): Promise<Sale | null> {
    const saleData = await this.prisma.sale.findFirst({
      where: { appointmentId, tenantId },
      include: {
        items: true,
        client: true,
        staff: true,
      },
    });

    if (!saleData) return null;
    return this.toDomain(saleData);
  }

  async findByPaymentMethod(
    paymentMethod: PaymentMethod,
    tenantId: string,
  ): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      where: {
        paymentMethod: this.mapDomainPaymentMethodToPrisma(paymentMethod),
        tenantId,
      },
      include: {
        items: true,
        client: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sales.map((sale) => this.toDomain(sale));
  }

  async count(tenantId: string, filters?: SaleFilters): Promise<number> {
    const where: Prisma.SaleWhereInput = { tenantId };

    // Apply filters if provided
    if (filters?.status) {
      where.status = this.mapDomainStatusToPrisma(filters.status);
    }
    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.staffId) {
      where.staffId = filters.staffId;
    }
    if (filters?.paymentMethod) {
      where.paymentMethod = this.mapDomainPaymentMethodToPrisma(
        filters.paymentMethod,
      );
    }

    return await this.prisma.sale.count({ where });
  }

  async countByTenant(
    tenantId: string,
    filters?: SaleFilters,
  ): Promise<number> {
    // Same as count method
    return this.count(tenantId, filters);
  }

  async getAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // Use the existing getSalesAnalytics method
    return this.getSalesAnalytics(tenantId, startDate, endDate);
  }

  async getSalesReport(tenantId: string, dateRange: DateRange): Promise<any> {
    return this.getSalesAnalytics(tenantId, dateRange.from, dateRange.to);
  }

  async getTopItems(
    tenantId: string,
    dateRange: DateRange,
    _type?: string,
  ): Promise<any> {
    return this.getTopSellingItems(tenantId, dateRange.from, dateRange.to);
  }

  async getSalesAnalytics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalSales: number;
    totalRevenue: number;
    averageSaleValue: number;
    topPaymentMethods: Array<{
      method: PaymentMethod;
      count: number;
      total: number;
    }>;
    salesByStatus: Record<SaleStatus, number>;
    dailySalesReport: Array<{ date: Date; sales: number; revenue: number }>;
  }> {
    const where: Prisma.SaleWhereInput = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [totalSales, totalRevenue, paymentMethodStats, statusStats] =
      await Promise.all([
        this.prisma.sale.count({ where }),
        this.prisma.sale.aggregate({
          where,
          _sum: { total: true },
        }),
        this.prisma.sale.groupBy({
          by: ['paymentMethod'],
          where,
          _count: { paymentMethod: true },
          _sum: { total: true },
        }),
        this.prisma.sale.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
      ]);

    const topPaymentMethods = paymentMethodStats.map((stat) => ({
      method: stat.paymentMethod as PaymentMethod,
      count: stat._count.paymentMethod,
      total: stat._sum.total?.toNumber() || 0,
    }));

    const salesByStatus: Record<SaleStatus, number> = {
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
      PARTIALLY_REFUNDED: 0,
    };

    statusStats.forEach((stat) => {
      salesByStatus[stat.status as SaleStatus] = stat._count.status;
    });

    return {
      totalSales,
      totalRevenue: totalRevenue._sum.total?.toNumber() || 0,
      averageSaleValue:
        totalSales > 0
          ? (totalRevenue._sum.total?.toNumber() || 0) / totalSales
          : 0,
      topPaymentMethods,
      salesByStatus,
      dailySalesReport: [], // Would require more complex aggregation
    };
  }

  async getTopSellingItems(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
  ): Promise<
    Array<{
      itemId: string;
      itemName: string;
      type: 'SERVICE' | 'PRODUCT';
      totalQuantity: number;
      totalRevenue: number;
    }>
  > {
    const where: Prisma.SaleItemWhereInput = {
      sale: {
        tenantId,
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }),
      },
    };

    const items = await this.prisma.saleItem.groupBy({
      by: ['itemId', 'name', 'type'],
      where,
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: limit,
    });

    return items.map((item) => ({
      itemId: item.itemId,
      itemName: item.name,
      type: item.type as 'SERVICE' | 'PRODUCT',
      totalQuantity: item._sum.quantity || 0,
      totalRevenue: item._sum.total?.toNumber() || 0,
    }));
  }

  async getStaffPerformance(
    tenantId: string,
    dateRange: DateRange,
  ): Promise<
    Array<{
      staffId: string;
      salesCount: number;
      totalRevenue: number;
      averageSaleValue: number;
    }>
  > {
    const where: Prisma.SaleWhereInput = {
      tenantId,
      status: 'COMPLETED' as PrismaSaleStatus,
    };

    if (dateRange.from || dateRange.to) {
      where.createdAt = {};
      if (dateRange.from) {
        where.createdAt.gte = dateRange.from;
      }
      if (dateRange.to) {
        where.createdAt.lte = dateRange.to;
      }
    }

    const performance = await this.prisma.sale.groupBy({
      by: ['staffId'],
      where,
      _count: { staffId: true },
      _sum: { total: true },
    });

    return performance.map((item) => ({
      staffId: item.staffId,
      salesCount: item._count.staffId,
      totalRevenue: item._sum.total?.toNumber() || 0,
      averageSaleValue:
        item._count.staffId > 0
          ? (item._sum.total?.toNumber() || 0) / item._count.staffId
          : 0,
    }));
  }

  private toDomain(saleData: PrismaSaleData): Sale {
    return new Sale({
      id: saleData.id,
      tenantId: saleData.tenantId,
      clientId: saleData.clientId || undefined,
      staffId: saleData.staffId,
      appointmentId: saleData.appointmentId || undefined,
      status: this.mapPrismaStatusToDomain(saleData.status),
      items: saleData.items.map((item) => ({
        id: item.id,
        itemId: item.serviceId || item.productId || item.id, // Added itemId mapping
        type: item.serviceId ? 'SERVICE' : 'PRODUCT',
        referenceId: item.serviceId || item.productId || '',
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        subtotal: Number(item.unitPrice) * item.quantity,
        taxRate: 0, // Default as not in current schema
        taxAmount: 0, // Default as not in current schema
        total: Number(item.total),
        staffId: undefined, // Not in current schema
        notes: undefined, // Not in current schema
      })),
      subtotal: Number(saleData.subtotal),
      discountAmount: Number(saleData.discount),
      taxAmount: Number(saleData.taxAmount),
      tipAmount: Number(saleData.tip),
      totalAmount: Number(saleData.total),
      paymentMethod: this.mapPrismaPaymentMethodToDomain(
        saleData.paymentMethod,
      ),
      type: saleData.items.some((item) => item.serviceId && item.productId)
        ? SaleType.MIXED
        : saleData.items.some((item) => item.serviceId)
          ? SaleType.SERVICE
          : SaleType.PRODUCT,
      notes: saleData.notes || undefined,
      paymentReference: undefined, // Not mapped in current schema
      saleDate: saleData.createdAt, // Map createdAt to saleDate
      refundedAmount: undefined, // Not in current schema
      refundReason: undefined, // Not in current schema
      cashierId: saleData.staffId, // Map staffId to cashierId
      createdAt: saleData.createdAt,
      updatedAt: saleData.updatedAt,
    });
  }

  private mapPrismaStatusToDomain(status: PrismaSaleStatus): SaleStatus {
    switch (status) {
      case 'PENDING':
        return SaleStatus.PENDING;
      case 'COMPLETED':
        return SaleStatus.COMPLETED;
      case 'CANCELED':
        return SaleStatus.CANCELLED;
      case 'REFUNDED':
        return SaleStatus.REFUNDED;
      default:
        return SaleStatus.PENDING;
    }
  }

  private mapDomainStatusToPrisma(status: SaleStatus): PrismaSaleStatus {
    switch (status) {
      case SaleStatus.PENDING:
        return 'PENDING';
      case SaleStatus.COMPLETED:
        return 'COMPLETED';
      case SaleStatus.CANCELLED:
        return 'CANCELED';
      case SaleStatus.REFUNDED:
        return 'REFUNDED';
      case SaleStatus.PARTIALLY_REFUNDED:
        return 'REFUNDED'; // Map to closest match
      default:
        return 'PENDING';
    }
  }

  private mapPrismaPaymentMethodToDomain(
    method: PrismaPaymentMethod,
  ): PaymentMethod {
    switch (method) {
      case 'CASH':
        return PaymentMethod.CASH;
      case 'CARD':
        return PaymentMethod.CARD;
      case 'BANK_TRANSFER':
        return PaymentMethod.TRANSFER;
      case 'DIGITAL_WALLET':
        return PaymentMethod.DIGITAL_WALLET;
      case 'PAYMENT_LINK':
        return PaymentMethod.DIGITAL_WALLET; // Map to closest match
      default:
        return PaymentMethod.CASH;
    }
  }

  private mapDomainPaymentMethodToPrisma(
    method: PaymentMethod,
  ): PrismaPaymentMethod {
    switch (method) {
      case PaymentMethod.CASH:
        return 'CASH';
      case PaymentMethod.CARD:
        return 'CARD';
      case PaymentMethod.TRANSFER:
        return 'BANK_TRANSFER';
      case PaymentMethod.DIGITAL_WALLET:
        return 'DIGITAL_WALLET';
      case PaymentMethod.CHECK:
        return 'CASH'; // Map to closest match
      case PaymentMethod.STORE_CREDIT:
        return 'PAYMENT_LINK'; // Map to closest match
      default:
        return 'CASH';
    }
  }
}
