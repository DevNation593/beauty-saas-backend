import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export interface CampaignCreatedEvent extends DomainEvent {
  type: 'CampaignCreated';
  payload: {
    campaignId: string;
    tenantId: string;
    name: string;
    type: CampaignType;
  };
}

export interface CampaignLaunchedEvent extends DomainEvent {
  type: 'CampaignLaunched';
  payload: {
    campaignId: string;
    tenantId: string;
    targetCount: number;
    channel: MessageChannel;
  };
}

export interface CampaignCompletedEvent extends DomainEvent {
  type: 'CampaignCompleted';
  payload: {
    campaignId: string;
    tenantId: string;
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export type CampaignType =
  | 'PROMOTIONAL'
  | 'REMINDER'
  | 'FOLLOW_UP'
  | 'BIRTHDAY'
  | 'WELCOME'
  | 'RETENTION';
export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'CANCELLED';
export type MessageChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

export interface ClientSegment {
  conditions: Array<{
    field: string;
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'not_contains'
      | 'greater_than'
      | 'less_than'
      | 'in'
      | 'not_in';
    value: string | number | boolean | string[] | number[];
  }>;
  logic: 'AND' | 'OR';
}

export interface CampaignMetrics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface CampaignProps {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  tenantId: string;
  targetSegment: ClientSegment;
  template: string;
  variables: Record<string, any>;
  channel: MessageChannel;
  scheduledAt?: Date;
  startDate?: Date;
  endDate?: Date;
  status: CampaignStatus;
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export class Campaign extends BaseEntity {
  private readonly props: CampaignProps;

  constructor(props: CampaignProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
  }

  // Getters
  get campaignId(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): CampaignType {
    return this.props.type;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get targetSegment(): ClientSegment {
    return this.props.targetSegment;
  }

  get template(): string {
    return this.props.template;
  }

  get variables(): Record<string, any> {
    return this.props.variables;
  }

  get channel(): MessageChannel {
    return this.props.channel;
  }

  get scheduledAt(): Date | undefined {
    return this.props.scheduledAt;
  }

  get startDate(): Date | undefined {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get status(): CampaignStatus {
    return this.props.status;
  }

  get metrics(): CampaignMetrics {
    return this.props.metrics;
  }

  // Business methods
  static create(data: {
    name: string;
    description?: string;
    type: CampaignType;
    tenantId: string;
    targetSegment: ClientSegment;
    template: string;
    variables?: Record<string, any>;
    channel: MessageChannel;
    scheduledAt?: Date;
  }): Campaign {
    // Validations
    if (!data.name?.trim()) {
      throw new Error('Campaign name is required');
    }

    if (!data.template?.trim()) {
      throw new Error('Campaign template is required');
    }

    if (!data.targetSegment?.conditions?.length) {
      throw new Error('Target segment must have at least one condition');
    }

    if (data.scheduledAt && data.scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const campaign = new Campaign({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description?.trim(),
      type: data.type,
      tenantId: data.tenantId,
      targetSegment: data.targetSegment,
      template: data.template.trim(),
      variables: data.variables ?? {},
      channel: data.channel,
      scheduledAt: data.scheduledAt,
      startDate: undefined,
      endDate: undefined,
      status: 'DRAFT',
      metrics: {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    campaign.addDomainEvent({
      type: 'CampaignCreated',
      payload: {
        campaignId: campaign.id,
        tenantId: campaign.tenantId,
        name: campaign.name,
        type: campaign.type,
      },
      aggregateId: campaign.id,
      occurredAt: new Date(),
    });

    return campaign;
  }

  updateDetails(data: {
    name?: string;
    description?: string;
    template?: string;
    variables?: Record<string, any>;
  }): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error('Cannot update campaign that is not in draft status');
    }

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Campaign name cannot be empty');
      }
      this.props.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.props.description = data.description.trim() || undefined;
    }

    if (data.template !== undefined) {
      if (!data.template.trim()) {
        throw new Error('Template cannot be empty');
      }
      this.props.template = data.template.trim();
    }

    if (data.variables !== undefined) {
      this.props.variables = data.variables;
    }

    this.props.updatedAt = new Date();
  }

  updateTargetSegment(segment: ClientSegment): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error(
        'Cannot update target segment of campaign that is not in draft status',
      );
    }

    if (!segment.conditions?.length) {
      throw new Error('Target segment must have at least one condition');
    }

    this.props.targetSegment = segment;
    this.props.updatedAt = new Date();
  }

  schedule(scheduledAt: Date): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error('Cannot schedule campaign that is not in draft status');
    }

    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    this.props.scheduledAt = scheduledAt;
    this.props.status = 'SCHEDULED';
    this.props.updatedAt = new Date();
  }

  launch(targetCount: number): void {
    if (this.props.status !== 'DRAFT' && this.props.status !== 'SCHEDULED') {
      throw new Error('Can only launch campaigns in draft or scheduled status');
    }

    this.props.status = 'SENDING';
    this.props.startDate = new Date();
    this.props.updatedAt = new Date();

    // Emit domain event
    this.addDomainEvent({
      type: 'CampaignLaunched',
      payload: {
        campaignId: this.id,
        tenantId: this.tenantId,
        targetCount,
        channel: this.channel,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  pause(): void {
    if (this.props.status !== 'SENDING') {
      throw new Error('Can only pause campaigns that are currently sending');
    }

    this.props.status = 'PAUSED';
    this.props.updatedAt = new Date();
  }

  resume(): void {
    if (this.props.status !== 'PAUSED') {
      throw new Error('Can only resume paused campaigns');
    }

    this.props.status = 'SENDING';
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (
      this.props.status === 'COMPLETED' ||
      this.props.status === 'CANCELLED'
    ) {
      throw new Error(
        'Cannot cancel a campaign that is already completed or cancelled',
      );
    }

    this.props.status = 'CANCELLED';
    this.props.endDate = new Date();
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (this.props.status !== 'SENDING') {
      throw new Error('Can only complete campaigns that are currently sending');
    }

    this.props.status = 'COMPLETED';
    this.props.endDate = new Date();
    this.props.updatedAt = new Date();

    // Emit domain event
    this.addDomainEvent({
      type: 'CampaignCompleted',
      payload: {
        campaignId: this.id,
        tenantId: this.tenantId,
        totalSent: this.props.metrics.totalSent,
        delivered: this.props.metrics.delivered,
        opened: this.props.metrics.opened,
        clicked: this.props.metrics.clicked,
        converted: this.props.metrics.converted,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  updateMetrics(metrics: Partial<CampaignMetrics>): void {
    if (metrics.totalSent !== undefined) {
      this.props.metrics.totalSent = metrics.totalSent;
    }
    if (metrics.delivered !== undefined) {
      this.props.metrics.delivered = metrics.delivered;
    }
    if (metrics.opened !== undefined) {
      this.props.metrics.opened = metrics.opened;
    }
    if (metrics.clicked !== undefined) {
      this.props.metrics.clicked = metrics.clicked;
    }
    if (metrics.converted !== undefined) {
      this.props.metrics.converted = metrics.converted;
    }

    this.props.updatedAt = new Date();
  }

  incrementMetric(metric: keyof CampaignMetrics, amount: number = 1): void {
    this.props.metrics[metric] += amount;
    this.props.updatedAt = new Date();
  }

  // Computed properties
  get isDraft(): boolean {
    return this.props.status === 'DRAFT';
  }

  get isScheduled(): boolean {
    return this.props.status === 'SCHEDULED';
  }

  get isSending(): boolean {
    return this.props.status === 'SENDING';
  }

  get isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  get isPaused(): boolean {
    return this.props.status === 'PAUSED';
  }

  get isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  get deliveryRate(): number {
    if (this.props.metrics.totalSent === 0) return 0;
    return (this.props.metrics.delivered / this.props.metrics.totalSent) * 100;
  }

  get openRate(): number {
    if (this.props.metrics.delivered === 0) return 0;
    return (this.props.metrics.opened / this.props.metrics.delivered) * 100;
  }

  get clickRate(): number {
    if (this.props.metrics.opened === 0) return 0;
    return (this.props.metrics.clicked / this.props.metrics.opened) * 100;
  }

  get conversionRate(): number {
    if (this.props.metrics.delivered === 0) return 0;
    return (this.props.metrics.converted / this.props.metrics.delivered) * 100;
  }

  get duration(): number | undefined {
    if (!this.props.startDate) return undefined;
    const endDate = this.props.endDate ?? new Date();
    return endDate.getTime() - this.props.startDate.getTime();
  }

  get isOverdue(): boolean {
    if (!this.props.scheduledAt) return false;
    return (
      this.props.scheduledAt < new Date() && this.props.status === 'SCHEDULED'
    );
  }

  // Business rules validation
  canBeEdited(): boolean {
    return this.props.status === 'DRAFT';
  }

  canBeLaunched(): boolean {
    return this.props.status === 'DRAFT' || this.props.status === 'SCHEDULED';
  }

  canBePaused(): boolean {
    return this.props.status === 'SENDING';
  }

  canBeResumed(): boolean {
    return this.props.status === 'PAUSED';
  }

  canBeCancelled(): boolean {
    return (
      this.props.status !== 'COMPLETED' && this.props.status !== 'CANCELLED'
    );
  }

  validateTemplate(template: string, variables: Record<string, any>): boolean {
    if (!template.trim()) return false;

    // Extract template variables (e.g., {{clientName}}, {{serviceName}})
    const templateVariables = template.match(/\{\{([^}]+)\}\}/g) || [];

    // Check if all required variables are provided
    for (const templateVar of templateVariables) {
      const varName = templateVar.replace(/\{\{|\}\}/g, '').trim();
      if (!Object.prototype.hasOwnProperty.call(variables, varName)) {
        return false;
      }
    }

    return true;
  }

  renderTemplate(clientData: Record<string, unknown>): string {
    let rendered = this.props.template;
    const allVariables = { ...this.props.variables, ...clientData };

    // Replace template variables
    rendered = rendered.replace(
      /\{\{([^}]+)\}\}/g,
      (match, varName: string) => {
        const trimmedVarName = varName.trim();
        const value: unknown = allVariables[trimmedVarName];
        if (value === undefined || value === null) {
          return match;
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          return String(value);
        }
        return match;
      },
    );

    return rendered;
  }

  getProps(): CampaignProps {
    return { ...this.props };
  }
}
