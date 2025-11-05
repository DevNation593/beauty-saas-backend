import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export enum TenantStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface TenantProps {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone: string;
  locale: string;
  status: TenantStatus;
  planId: string; // Reference to Plan entity
  subscriptionStartDate: Date;
  subscriptionEndDate?: Date;
  trialEndDate?: Date;
  maxUsers: number;
  maxClients: number;
  maxLocations: number;
  features: string[]; // Array of enabled features
  domain?: string; // Custom domain (matches schema)
  logoUrl?: string;
  settings: Record<string, unknown>;
  billingEmail?: string;
  taxId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TenantCreatedEvent implements DomainEvent {
  readonly type = 'TENANT_CREATED';
  readonly payload: {
    tenantId: string;
    name: string;
    email: string;
    planId: string;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(tenantId: string, name: string, email: string, planId: string) {
    this.aggregateId = tenantId;
    this.occurredAt = new Date();
    this.payload = {
      tenantId,
      name,
      email,
      planId,
    };
  }
}

export class TenantStatusChangedEvent implements DomainEvent {
  readonly type = 'TENANT_STATUS_CHANGED';
  readonly payload: {
    tenantId: string;
    oldStatus: TenantStatus;
    newStatus: TenantStatus;
    reason?: string;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    tenantId: string,
    oldStatus: TenantStatus,
    newStatus: TenantStatus,
    reason?: string,
  ) {
    this.aggregateId = tenantId;
    this.occurredAt = new Date();
    this.payload = {
      tenantId,
      oldStatus,
      newStatus,
      reason,
    };
  }
}

export class TenantSubscriptionUpdatedEvent implements DomainEvent {
  readonly type = 'TENANT_SUBSCRIPTION_UPDATED';
  readonly payload: {
    tenantId: string;
    oldPlanId: string;
    newPlanId: string;
    newEndDate?: Date;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    tenantId: string,
    oldPlanId: string,
    newPlanId: string,
    newEndDate?: Date,
  ) {
    this.aggregateId = tenantId;
    this.occurredAt = new Date();
    this.payload = {
      tenantId,
      oldPlanId,
      newPlanId,
      newEndDate,
    };
  }
}

export class Tenant extends BaseEntity {
  private props: TenantProps;

  constructor(props: TenantProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
  }

  // Getters
  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get status(): TenantStatus {
    return this.props.status;
  }

  get planId(): string {
    return this.props.planId;
  }

  get subscriptionStartDate(): Date {
    return this.props.subscriptionStartDate;
  }

  get subscriptionEndDate(): Date | undefined {
    return this.props.subscriptionEndDate;
  }

  get trialEndDate(): Date | undefined {
    return this.props.trialEndDate;
  }

  get maxUsers(): number {
    return this.props.maxUsers;
  }

  get maxClients(): number {
    return this.props.maxClients;
  }

  get maxLocations(): number {
    return this.props.maxLocations;
  }

  get features(): string[] {
    return this.props.features;
  }

  get domain(): string | undefined {
    return this.props.domain;
  }

  get logoUrl(): string | undefined {
    return this.props.logoUrl;
  }

  get settings(): Record<string, unknown> {
    return this.props.settings;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get locale(): string {
    return this.props.locale;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get state(): string | undefined {
    return this.props.state;
  }

  get country(): string | undefined {
    return this.props.country;
  }

  get billingEmail(): string | undefined {
    return this.props.billingEmail;
  }

  get taxId(): string | undefined {
    return this.props.taxId;
  }

  // Factory method
  public static create(
    props: Omit<TenantProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Tenant {
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const tenant = new Tenant({
      ...props,
      id: tenantId,
      createdAt: now,
      updatedAt: now,
    });

    tenant.addDomainEvent(
      new TenantCreatedEvent(tenant.id, props.name, props.email, props.planId),
    );

    return tenant;
  }

  // Business methods
  public updateStatus(newStatus: TenantStatus, reason?: string): void {
    if (this.props.status === newStatus) return;

    const oldStatus = this.props.status;
    this.props.status = newStatus;
    this.props.isActive = newStatus === TenantStatus.ACTIVE;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new TenantStatusChangedEvent(this.id, oldStatus, newStatus, reason),
    );
  }

  public updateSubscription(newPlanId: string, endDate?: Date): void {
    if (this.props.planId === newPlanId) return;

    const oldPlanId = this.props.planId;
    this.props.planId = newPlanId;
    this.props.subscriptionEndDate = endDate;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new TenantSubscriptionUpdatedEvent(
        this.id,
        oldPlanId,
        newPlanId,
        endDate,
      ),
    );
  }

  public updateProfile(
    updates: Partial<
      Pick<
        TenantProps,
        | 'name'
        | 'email'
        | 'phone'
        | 'address'
        | 'city'
        | 'state'
        | 'country'
        | 'timezone'
        | 'locale'
        | 'domain'
        | 'logoUrl'
        | 'billingEmail'
        | 'taxId'
      >
    >,
  ): void {
    Object.assign(this.props, updates);
    this.props.updatedAt = new Date();
  }

  public updateSettings(settings: Record<string, unknown>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.props.updatedAt = new Date();
  }

  public addFeature(feature: string): void {
    if (!this.props.features.includes(feature)) {
      this.props.features.push(feature);
      this.props.updatedAt = new Date();
    }
  }

  public removeFeature(feature: string): void {
    const index = this.props.features.indexOf(feature);
    if (index > -1) {
      this.props.features.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  public hasFeature(feature: string): boolean {
    return this.props.features.includes(feature);
  }

  public extendTrial(days: number): void {
    if (this.props.status === TenantStatus.TRIAL) {
      const currentTrialEnd = this.props.trialEndDate || new Date();
      this.props.trialEndDate = new Date(
        currentTrialEnd.getTime() + days * 24 * 60 * 60 * 1000,
      );
      this.props.updatedAt = new Date();
    }
  }

  public isTrialExpired(): boolean {
    if (this.props.status !== TenantStatus.TRIAL || !this.props.trialEndDate) {
      return false;
    }
    return new Date() > this.props.trialEndDate;
  }

  public isSubscriptionExpired(): boolean {
    if (!this.props.subscriptionEndDate) {
      return false;
    }
    return new Date() > this.props.subscriptionEndDate;
  }

  public getDaysUntilExpiry(): number | null {
    const expiryDate =
      this.props.status === TenantStatus.TRIAL
        ? this.props.trialEndDate
        : this.props.subscriptionEndDate;

    if (!expiryDate) return null;

    const today = new Date();
    const timeDiff = expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getProps(): TenantProps {
    return { ...this.props };
  }
}
