import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum ClientSegment {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  PREMIUM = 'PREMIUM',
  NEW = 'NEW',
  LOYAL = 'LOYAL',
  AT_RISK = 'AT_RISK',
}

export interface ClientProps {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  status: ClientStatus;
  segment: ClientSegment;
  notes?: string;
  tags: string[];
  preferences: Record<string, unknown>;
  marketingConsent: boolean;
  referredBy?: string;
  lastVisit?: Date;
  totalSpent: number;
  visitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ClientCreatedEvent implements DomainEvent {
  readonly type = 'CLIENT_CREATED';
  readonly payload: {
    clientId: string;
    tenantId: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    clientId: string,
    tenantId: string,
    firstName: string,
    lastName: string,
    email?: string,
  ) {
    this.aggregateId = clientId;
    this.occurredAt = new Date();
    this.payload = {
      clientId,
      tenantId,
      firstName,
      lastName,
      email,
    };
  }
}

export class ClientUpdatedEvent implements DomainEvent {
  readonly type = 'CLIENT_UPDATED';
  readonly payload: {
    clientId: string;
    tenantId: string;
    changes: Partial<ClientProps>;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    clientId: string,
    tenantId: string,
    changes: Partial<ClientProps>,
  ) {
    this.aggregateId = clientId;
    this.occurredAt = new Date();
    this.payload = {
      clientId,
      tenantId,
      changes,
    };
  }
}

export class ClientSegmentChangedEvent implements DomainEvent {
  readonly type = 'CLIENT_SEGMENT_CHANGED';
  readonly payload: {
    clientId: string;
    tenantId: string;
    oldSegment: ClientSegment;
    newSegment: ClientSegment;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    clientId: string,
    tenantId: string,
    oldSegment: ClientSegment,
    newSegment: ClientSegment,
  ) {
    this.aggregateId = clientId;
    this.occurredAt = new Date();
    this.payload = {
      clientId,
      tenantId,
      oldSegment,
      newSegment,
    };
  }
}

export class Client extends BaseEntity {
  private props: ClientProps;

  constructor(props: ClientProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
  }

  // Getters for repository access
  get tenantId(): string {
    return this.props.tenantId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get status(): ClientStatus {
    return this.props.status;
  }

  get segment(): ClientSegment {
    return this.props.segment;
  }

  get totalSpent(): number {
    return this.props.totalSpent;
  }

  get visitCount(): number {
    return this.props.visitCount;
  }

  get marketingConsent(): boolean {
    return this.props.marketingConsent;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get preferences(): Record<string, unknown> {
    return this.props.preferences;
  }

  get lastVisit(): Date | undefined {
    return this.props.lastVisit;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get state(): string | undefined {
    return this.props.state;
  }

  get zipCode(): string | undefined {
    return this.props.zipCode;
  }

  get country(): string | undefined {
    return this.props.country;
  }

  get referredBy(): string | undefined {
    return this.props.referredBy;
  }

  public static create(
    props: Omit<
      ClientProps,
      'id' | 'totalSpent' | 'visitCount' | 'createdAt' | 'updatedAt'
    >,
  ): Client {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const client = new Client({
      ...props,
      id: clientId,
      totalSpent: 0,
      visitCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    client.addDomainEvent(
      new ClientCreatedEvent(
        client.id,
        props.tenantId,
        props.firstName,
        props.lastName,
        props.email,
      ),
    );

    return client;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get isActive(): boolean {
    return this.props.status === ClientStatus.ACTIVE;
  }

  get isVip(): boolean {
    return this.props.segment === ClientSegment.VIP;
  }

  public updateProfile(
    updates: Partial<
      Pick<
        ClientProps,
        | 'firstName'
        | 'lastName'
        | 'email'
        | 'phone'
        | 'dateOfBirth'
        | 'address'
        | 'city'
        | 'state'
        | 'zipCode'
        | 'country'
        | 'notes'
      >
    >,
  ): void {
    Object.assign(this.props, updates);
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ClientUpdatedEvent(this.id, this.props.tenantId, updates),
    );
  }

  public updateStatus(status: ClientStatus): void {
    if (this.props.status === status) return;

    this.props.status = status;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ClientUpdatedEvent(this.id, this.props.tenantId, { status }),
    );
  }

  public updateTags(tags: string[]): void {
    this.props.tags = tags;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ClientUpdatedEvent(this.id, this.props.tenantId, { tags }),
    );
  }

  public updateVisitHistory(totalSpent: number, visitDate?: Date): void {
    this.props.visitCount += 1;
    this.props.totalSpent += totalSpent;
    this.props.lastVisit = visitDate || new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ClientUpdatedEvent(this.id, this.props.tenantId, {
        visitCount: this.props.visitCount,
        totalSpent: this.props.totalSpent,
        lastVisit: this.props.lastVisit,
      }),
    );
  }

  public updateSegment(segment: ClientSegment): void {
    if (this.props.segment === segment) return;

    const oldSegment = this.props.segment;
    this.props.segment = segment;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ClientSegmentChangedEvent(
        this.id,
        this.props.tenantId,
        oldSegment,
        segment,
      ),
    );
  }

  public addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.props.updatedAt = new Date();
    }
  }

  public removeTag(tag: string): void {
    const index = this.props.tags.indexOf(tag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  public updatePreferences(preferences: Record<string, any>): void {
    this.props.preferences = { ...this.props.preferences, ...preferences };
    this.props.updatedAt = new Date();
  }

  public recordVisit(amountSpent: number = 0): void {
    this.props.visitCount += 1;
    this.props.totalSpent += amountSpent;
    this.props.lastVisit = new Date();
    this.props.updatedAt = new Date();

    // Auto-segment based on spending and visits
    this.autoUpdateSegment();
  }

  private autoUpdateSegment(): void {
    let newSegment = this.props.segment;

    if (this.props.totalSpent >= 1000 || this.props.visitCount >= 20) {
      newSegment = ClientSegment.VIP;
    } else if (this.props.visitCount >= 3) {
      newSegment = ClientSegment.REGULAR;
    } else if (this.props.visitCount === 1) {
      newSegment = ClientSegment.NEW;
    } else {
      // No visits in a while - could be lost
      const daysSinceLastVisit = this.props.lastVisit
        ? Math.floor(
            (Date.now() - this.props.lastVisit.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;

      if (daysSinceLastVisit > 180) {
        newSegment = ClientSegment.AT_RISK;
      }
    }

    if (newSegment !== this.props.segment) {
      this.updateSegment(newSegment);
    }
  }

  public updateMarketingConsent(consent: boolean): void {
    this.props.marketingConsent = consent;
    this.props.updatedAt = new Date();
  }

  // Getters for computed properties
  get age(): number | null {
    if (!this.props.dateOfBirth) return null;

    const today = new Date();
    const birth = new Date(this.props.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  get daysSinceLastVisit(): number | null {
    if (!this.props.lastVisit) return null;

    return Math.floor(
      (Date.now() - this.props.lastVisit.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  get averageSpentPerVisit(): number {
    if (this.props.visitCount === 0) return 0;
    return this.props.totalSpent / this.props.visitCount;
  }

  // Validation methods
  public isValidForMarketing(): boolean {
    return (
      this.props.marketingConsent &&
      this.props.status === ClientStatus.ACTIVE &&
      Boolean(this.props.email || this.props.phone)
    );
  }

  public canBeDeleted(): boolean {
    // Business rule: clients with appointments or sales history cannot be deleted
    return this.props.visitCount === 0 && this.props.totalSpent === 0;
  }

  getProps(): ClientProps {
    return { ...this.props };
  }
}
