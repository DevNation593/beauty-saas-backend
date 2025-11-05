import { Client, ClientStatus, ClientSegment } from './Client';

export interface ClientRepository {
  save(client: Client): Promise<void>;
  update(client: Client): Promise<void>;
  findById(id: string, tenantId: string): Promise<Client | null>;
  findByEmail(email: string, tenantId: string): Promise<Client | null>;
  findByPhone(phone: string, tenantId: string): Promise<Client | null>;
  findByTenant(tenantId: string, filters?: ClientFilters): Promise<Client[]>;
  findBySegment(segment: ClientSegment, tenantId: string): Promise<Client[]>;
  findByTags(tags: string[], tenantId: string): Promise<Client[]>;
  search(query: string, tenantId: string): Promise<Client[]>;
  delete(id: string, tenantId: string): Promise<void>;
  count(tenantId: string, filters?: ClientFilters): Promise<number>;
  findAll(
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
  }>;
  findByStatus(status: ClientStatus, tenantId: string): Promise<Client[]>;
  getClientAnalytics(tenantId: string): Promise<{
    totalClients: number;
    activeClients: number;
    newClientsThisMonth: number;
    averageLifetimeValue: number;
    segmentDistribution: Record<ClientSegment, number>;
    topSpenders: Array<{ client: Client; totalSpent: number }>;
  }>;
  getRetentionReport(tenantId: string): Promise<
    Array<{
      month: Date;
      newClients: number;
      returningClients: number;
      retentionRate: number;
    }>
  >;
  exportClients(tenantId: string, filters?: ClientFilters): Promise<any>;
}

export interface ClientFilters {
  status?: ClientStatus;
  segment?: ClientSegment;
  tags?: string[];
  city?: string;
  state?: string;
  country?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  lastVisitFrom?: Date;
  lastVisitTo?: Date;
  ageRange?: {
    min?: number;
    max?: number;
  };
  lastVisitRange?: {
    from?: Date;
    to?: Date;
  };
  spentRange?: {
    min?: number;
    max?: number;
  };
  marketingConsent?: boolean;
  search?: string;
}

export interface ClientSortOptions {
  field:
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'createdAt'
    | 'lastVisit'
    | 'totalSpent';
  direction: 'asc' | 'desc';
  order?: 'asc' | 'desc'; // Para compatibilidad con uso existente
}

export interface ClientAnalyticsService {
  getSegmentDistribution(
    tenantId: string,
  ): Promise<Record<ClientSegment, number>>;
  getTopClients(tenantId: string, limit?: number): Promise<Client[]>;
  getClientGrowth(
    tenantId: string,
    period: 'week' | 'month' | 'year',
  ): Promise<
    {
      period: string;
      newClients: number;
      totalClients: number;
    }[]
  >;
  getClientRetention(tenantId: string): Promise<
    {
      period: string;
      retentionRate: number;
    }[]
  >;
  getAverageLifetimeValue(tenantId: string): Promise<number>;
  getBirthdayClients(tenantId: string, daysAhead?: number): Promise<Client[]>;
  getLostClients(
    tenantId: string,
    daysSinceLastVisit?: number,
  ): Promise<Client[]>;
}

export interface ClientImportService {
  importFromCsv(
    file: Buffer,
    tenantId: string,
  ): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }>;
  importFromExcel(
    file: Buffer,
    tenantId: string,
  ): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }>;
  validateImportData(data: Record<string, unknown>[]): Promise<{
    valid: Record<string, unknown>[];
    invalid: Record<string, unknown>[];
    errors: string[];
  }>;
}

export interface ClientExportService {
  exportToCsv(tenantId: string, filters?: ClientFilters): Promise<Buffer>;
  exportToExcel(tenantId: string, filters?: ClientFilters): Promise<Buffer>;
  exportSegment(segment: ClientSegment, tenantId: string): Promise<Buffer>;
}
