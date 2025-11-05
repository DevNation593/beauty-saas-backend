import { Tenant, TenantStatus } from './Tenant';

export interface TenantRepository {
  create(tenant: Tenant): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findByEmail(email: string): Promise<Tenant | null>;
  findByDomain(domain: string): Promise<Tenant | null>;
  findAll(filters?: {
    status?: TenantStatus;
    planId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Tenant[]>;
  update(tenant: Tenant): Promise<Tenant>;
  delete(id: string): Promise<void>;
  count(filters?: { status?: TenantStatus; planId?: string }): Promise<number>;
  getAnalytics(): Promise<{
    total: number;
    byStatus: Record<TenantStatus, number>;
    byPlan: Record<string, number>;
    trialExpiring: number;
    subscriptionExpiring: number;
  }>;
}
