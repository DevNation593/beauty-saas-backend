import { Report, ReportType, ReportFormat, Dashboard } from './Report';

export interface ReportFilters {
  search?: string;
  type?: ReportType;
  format?: ReportFormat;
  isScheduled?: boolean;
  isGenerated?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ReportRepository {
  // Basic CRUD operations
  save(report: Report): Promise<void>;
  update(report: Report): Promise<void>;
  findById(id: string, tenantId: string): Promise<Report | null>;
  delete(id: string, tenantId: string): Promise<void>;

  // Query operations
  findAll(
    tenantId: string,
    filters?: ReportFilters,
    pagination?: { page: number; limit: number },
  ): Promise<{
    reports: Report[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  findByType(type: ReportType, tenantId: string): Promise<Report[]>;
  findScheduledReports(tenantId: string): Promise<Report[]>;
  findOverdueReports(tenantId: string): Promise<Report[]>;
  findRecentReports(tenantId: string, limit?: number): Promise<Report[]>;
}

export interface DashboardRepository {
  // Basic CRUD operations
  save(dashboard: Dashboard): Promise<void>;
  update(dashboard: Dashboard): Promise<void>;
  findById(id: string, tenantId: string): Promise<Dashboard | null>;
  delete(id: string, tenantId: string): Promise<void>;

  // Query operations
  findAll(tenantId: string): Promise<Dashboard[]>;
  findDefault(tenantId: string): Promise<Dashboard | null>;
  setAsDefault(dashboardId: string, tenantId: string): Promise<void>;
}

export interface ReportGenerationService {
  // Sales reports
  generateSalesReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      groupBy?: 'day' | 'week' | 'month';
      includeServices?: boolean;
      includeProducts?: boolean;
      staffIds?: string[];
    },
  ): Promise<{
    summary: {
      totalRevenue: number;
      totalSales: number;
      averageSaleValue: number;
      totalDiscount: number;
      totalTax: number;
    };
    breakdown: Array<{
      date: Date;
      revenue: number;
      salesCount: number;
      averageValue: number;
    }>;
    topServices: Array<{
      serviceId: string;
      serviceName: string;
      revenue: number;
      count: number;
    }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      revenue: number;
      quantity: number;
    }>;
    staffPerformance: Array<{
      staffId: string;
      staffName: string;
      revenue: number;
      salesCount: number;
    }>;
  }>;

  // Appointment reports
  generateAppointmentReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      groupBy?: 'day' | 'week' | 'month';
      staffIds?: string[];
      serviceIds?: string[];
    },
  ): Promise<{
    summary: {
      totalAppointments: number;
      completedAppointments: number;
      cancelledAppointments: number;
      noShowAppointments: number;
      completionRate: number;
      averageDuration: number;
    };
    breakdown: Array<{
      date: Date;
      total: number;
      completed: number;
      cancelled: number;
      noShow: number;
    }>;
    servicePopularity: Array<{
      serviceId: string;
      serviceName: string;
      appointmentCount: number;
      revenue: number;
    }>;
    staffUtilization: Array<{
      staffId: string;
      staffName: string;
      totalHours: number;
      bookedHours: number;
      utilizationRate: number;
    }>;
    busyHours: Array<{
      hour: number;
      appointmentCount: number;
    }>;
  }>;

  // Client reports
  generateClientReport(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    options?: {
      includeSegmentation?: boolean;
      includeLifetimeValue?: boolean;
    },
  ): Promise<{
    summary: {
      totalClients: number;
      newClients: number;
      activeClients: number;
      averageLifetimeValue: number;
      averageVisitFrequency: number;
    };
    segmentation: Array<{
      segment: string;
      clientCount: number;
      percentage: number;
      averageValue: number;
    }>;
    retention: Array<{
      month: Date;
      newClients: number;
      returningClients: number;
      retentionRate: number;
    }>;
    topClients: Array<{
      clientId: string;
      clientName: string;
      totalSpent: number;
      visitCount: number;
      lastVisit: Date;
    }>;
  }>;

  // Marketing reports
  generateMarketingReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      campaignIds?: string[];
      channels?: string[];
    },
  ): Promise<{
    summary: {
      totalCampaigns: number;
      totalMessagesSent: number;
      averageDeliveryRate: number;
      averageOpenRate: number;
      averageClickRate: number;
      averageConversionRate: number;
      totalROI: number;
    };
    campaignPerformance: Array<{
      campaignId: string;
      campaignName: string;
      messagesSent: number;
      deliveryRate: number;
      openRate: number;
      clickRate: number;
      conversionRate: number;
      roi: number;
    }>;
    channelPerformance: Array<{
      channel: string;
      messagesSent: number;
      deliveryRate: number;
      openRate: number;
      clickRate: number;
      conversionRate: number;
    }>;
  }>;

  // Inventory reports
  generateInventoryReport(
    tenantId: string,
    options?: {
      includeValuation?: boolean;
      includeMovements?: boolean;
      productIds?: string[];
    },
  ): Promise<{
    summary: {
      totalProducts: number;
      totalStockValue: number;
      lowStockItems: number;
      outOfStockItems: number;
    };
    stockStatus: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      minStock: number;
      maxStock?: number;
      status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCKED';
      value: number;
    }>;
    topMovers: Array<{
      productId: string;
      productName: string;
      totalMovements: number;
      totalOut: number;
      totalIn: number;
    }>;
    valuation: Array<{
      category: string;
      productCount: number;
      totalCost: number;
      totalValue: number;
      profitMargin: number;
    }>;
  }>;

  // Financial reports
  generateFinancialReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      includeExpenses?: boolean;
      includeTaxes?: boolean;
    },
  ): Promise<{
    summary: {
      totalRevenue: number;
      totalExpenses: number;
      netProfit: number;
      profitMargin: number;
      totalTax: number;
    };
    revenue: {
      services: number;
      products: number;
      other: number;
    };
    expenses: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    monthlyTrends: Array<{
      month: Date;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
    paymentMethods: Array<{
      method: string;
      amount: number;
      transactionCount: number;
      percentage: number;
    }>;
  }>;

  // Staff performance reports
  generateStaffPerformanceReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      staffIds?: string[];
      includeCommissions?: boolean;
    },
  ): Promise<{
    summary: {
      totalStaff: number;
      totalRevenue: number;
      averageRevenuePerStaff: number;
      totalCommissions: number;
    };
    staffPerformance: Array<{
      staffId: string;
      staffName: string;
      role: string;
      hoursWorked: number;
      appointmentsCompleted: number;
      revenue: number;
      averageRating: number;
      commissions: number;
    }>;
    servicePerformance: Array<{
      serviceId: string;
      serviceName: string;
      staffPerformance: Array<{
        staffId: string;
        staffName: string;
        count: number;
        revenue: number;
        averageRating: number;
      }>;
    }>;
  }>;
}

export interface ReportExportService {
  exportToPDF(
    reportData: Record<string, unknown>,
    reportType: ReportType,
    options?: {
      title?: string;
      logo?: Buffer;
      includeCharts?: boolean;
    },
  ): Promise<Buffer>;

  exportToExcel(
    reportData: Record<string, unknown>,
    reportType: ReportType,
    options?: {
      worksheetName?: string;
      includeCharts?: boolean;
    },
  ): Promise<Buffer>;

  exportToCSV(
    reportData: Record<string, unknown>,
    reportType: ReportType,
    options?: {
      delimiter?: string;
      includeHeaders?: boolean;
    },
  ): Promise<Buffer>;

  exportToJSON(reportData: Record<string, unknown>): Promise<Buffer>;
}

export interface ReportSchedulingService {
  scheduleReport(reportId: string, tenantId: string): Promise<void>;
  unscheduleReport(reportId: string, tenantId: string): Promise<void>;
  getScheduledReports(tenantId: string): Promise<Report[]>;
  executeScheduledReport(reportId: string, tenantId: string): Promise<void>;
  processOverdueReports(tenantId: string): Promise<number>;
}

export interface ReportAnalyticsService {
  getReportUsageStatistics(tenantId: string): Promise<{
    totalReports: number;
    scheduledReports: number;
    reportsGenerated: number;
    mostUsedReportTypes: Array<{
      type: ReportType;
      count: number;
      percentage: number;
    }>;
    averageGenerationTime: number;
  }>;

  getPopularReports(
    tenantId: string,
    limit?: number,
  ): Promise<
    Array<{
      reportId: string;
      reportName: string;
      type: ReportType;
      generationCount: number;
      lastGenerated: Date;
    }>
  >;

  getReportTrends(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      date: Date;
      reportsGenerated: number;
      uniqueReports: number;
    }>
  >;
}
