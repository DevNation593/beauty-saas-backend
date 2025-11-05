import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export interface ReportGeneratedEvent extends DomainEvent {
  type: 'ReportGenerated';
  payload: {
    reportId: string;
    tenantId: string;
    reportType: ReportType;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
  };
}

export interface DashboardCreatedEvent extends DomainEvent {
  type: 'DashboardCreated';
  payload: {
    dashboardId: string;
    tenantId: string;
    name: string;
    widgets: string[];
  };
}

export type ReportType =
  | 'SALES'
  | 'APPOINTMENTS'
  | 'CLIENTS'
  | 'MARKETING'
  | 'INVENTORY'
  | 'FINANCES'
  | 'FINANCIAL'
  | 'STAFF_PERFORMANCE'
  | 'CUSTOM';

export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON';

export type ReportFrequency =
  | 'ONCE'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY';

export interface ReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  staffIds?: string[];
  serviceIds?: string[];
  clientIds?: string[];
  productIds?: string[];
  departments?: string[];
  [key: string]: unknown;
}

export interface ReportProps {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  tenantId: string;
  filters: ReportFilters;
  format: ReportFormat;
  status: ReportStatus;
  parameters?: Record<string, any>;
  schedule?: {
    frequency: ReportFrequency;
    nextRunAt?: Date;
    lastRunAt?: Date;
    isActive: boolean;
  };
  data?: unknown; // Report results
  generatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Report extends BaseEntity {
  private readonly props: ReportProps;

  constructor(props: ReportProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
  }

  // Getters
  get reportId(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): ReportType {
    return this.props.type;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get filters(): ReportFilters {
    return this.props.filters;
  }

  get format(): ReportFormat {
    return this.props.format;
  }

  get schedule(): ReportProps['schedule'] {
    return this.props.schedule;
  }

  get data(): unknown {
    return this.props.data;
  }

  get generatedAt(): Date | undefined {
    return this.props.generatedAt;
  }

  // Business methods
  static create(data: {
    name: string;
    description?: string;
    type: ReportType;
    tenantId: string;
    filters: ReportFilters;
    format: ReportFormat;
    schedule?: {
      frequency: ReportFrequency;
      nextRunAt?: Date;
    };
  }): Report {
    // Validations
    if (!data.name?.trim()) {
      throw new Error('Report name is required');
    }

    if (
      data.schedule?.frequency === 'ONCE' &&
      data.schedule.nextRunAt &&
      data.schedule.nextRunAt <= new Date()
    ) {
      throw new Error('Scheduled time must be in the future');
    }

    const report = new Report({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description?.trim(),
      type: data.type,
      tenantId: data.tenantId,
      filters: data.filters,
      format: data.format,
      status: ReportStatus.PENDING,
      parameters: {},
      schedule: data.schedule
        ? {
            frequency: data.schedule.frequency,
            nextRunAt: data.schedule.nextRunAt,
            lastRunAt: undefined,
            isActive: true,
          }
        : undefined,
      data: undefined,
      generatedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return report;
  }

  updateDetails(data: {
    name?: string;
    description?: string;
    filters?: ReportFilters;
    format?: ReportFormat;
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Report name cannot be empty');
      }
      this.props.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.props.description = data.description.trim() || undefined;
    }

    if (data.filters !== undefined) {
      this.props.filters = data.filters;
    }

    if (data.format !== undefined) {
      this.props.format = data.format;
    }

    this.props.updatedAt = new Date();
  }

  updateSchedule(schedule: {
    frequency: ReportFrequency;
    nextRunAt?: Date;
    isActive?: boolean;
  }): void {
    if (
      schedule.frequency === 'ONCE' &&
      schedule.nextRunAt &&
      schedule.nextRunAt <= new Date()
    ) {
      throw new Error('Scheduled time must be in the future');
    }

    this.props.schedule = {
      frequency: schedule.frequency,
      nextRunAt: schedule.nextRunAt,
      lastRunAt: this.props.schedule?.lastRunAt,
      isActive: schedule.isActive ?? true,
    };

    this.props.updatedAt = new Date();
  }

  pauseSchedule(): void {
    if (!this.props.schedule) {
      throw new Error('Report is not scheduled');
    }

    this.props.schedule.isActive = false;
    this.props.updatedAt = new Date();
  }

  resumeSchedule(): void {
    if (!this.props.schedule) {
      throw new Error('Report is not scheduled');
    }

    this.props.schedule.isActive = true;
    this.props.updatedAt = new Date();
  }

  markAsGenerated(data: unknown): void {
    this.props.data = data;
    this.props.generatedAt = new Date();
    this.props.updatedAt = new Date();

    // Update schedule if needed
    if (this.props.schedule && this.props.schedule.isActive) {
      this.props.schedule.lastRunAt = new Date();
      this.props.schedule.nextRunAt = this.calculateNextRunDate();
    }

    // Emit domain event
    this.addDomainEvent({
      type: 'ReportGenerated',
      payload: {
        reportId: this.id,
        tenantId: this.tenantId,
        reportType: this.type,
        dateRange: this.filters.dateRange ?? {
          startDate: new Date(),
          endDate: new Date(),
        },
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  private calculateNextRunDate(): Date | undefined {
    if (!this.props.schedule) return undefined;

    const now = new Date();
    const { frequency } = this.props.schedule;

    switch (frequency) {
      case 'ONCE':
        return undefined;
      case 'DAILY':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'WEEKLY':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'MONTHLY': {
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      }
      case 'QUARTERLY': {
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
      }
      case 'YEARLY': {
        const nextYear = new Date(now);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return nextYear;
      }
      default:
        return undefined;
    }
  }

  // Computed properties
  get isScheduled(): boolean {
    return this.props.schedule !== undefined;
  }

  get isActive(): boolean {
    return this.props.schedule?.isActive ?? false;
  }

  get isGenerated(): boolean {
    return this.props.generatedAt !== undefined;
  }

  get isOverdue(): boolean {
    if (!this.props.schedule?.nextRunAt) return false;
    return (
      this.props.schedule.nextRunAt < new Date() && this.props.schedule.isActive
    );
  }

  get age(): number | undefined {
    if (!this.props.generatedAt) return undefined;
    return Date.now() - this.props.generatedAt.getTime();
  }

  // Business rules validation
  canBeGenerated(): boolean {
    // Check if required filters are present
    if (this.props.type === 'SALES' || this.props.type === 'FINANCIAL') {
      return this.props.filters.dateRange !== undefined;
    }
    return true;
  }

  canBeScheduled(): boolean {
    return this.canBeGenerated();
  }

  validateFilters(): boolean {
    const { filters } = this.props;

    // Date range validation
    if (filters.dateRange) {
      if (filters.dateRange.startDate >= filters.dateRange.endDate) {
        return false;
      }
    }

    // Type-specific validations
    switch (this.props.type) {
      case 'SALES':
      case 'FINANCIAL':
        return filters.dateRange !== undefined;
      case 'STAFF_PERFORMANCE':
        return filters.staffIds !== undefined && filters.staffIds.length > 0;
      default:
        return true;
    }
  }

  getProps(): ReportProps {
    return { ...this.props };
  }
}

// Dashboard entity
export interface DashboardWidget {
  id: string;
  type: 'CHART' | 'TABLE' | 'METRIC' | 'GAUGE';
  title: string;
  reportType: ReportType;
  filters: ReportFilters;
  chartType?: 'LINE' | 'BAR' | 'PIE' | 'DOUGHNUT' | 'AREA';
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DashboardProps {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Dashboard extends BaseEntity {
  private readonly props: DashboardProps;

  constructor(props: DashboardProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
  }

  // Getters
  get dashboardId(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get widgets(): DashboardWidget[] {
    return this.props.widgets;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  // Business methods
  static create(data: {
    name: string;
    description?: string;
    tenantId: string;
    widgets?: DashboardWidget[];
    isDefault?: boolean;
  }): Dashboard {
    if (!data.name?.trim()) {
      throw new Error('Dashboard name is required');
    }

    const dashboard = new Dashboard({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description?.trim(),
      tenantId: data.tenantId,
      widgets: data.widgets ?? [],
      isDefault: data.isDefault ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    dashboard.addDomainEvent({
      type: 'DashboardCreated',
      payload: {
        dashboardId: dashboard.id,
        tenantId: dashboard.tenantId,
        name: dashboard.name,
        widgets: dashboard.widgets.map((w) => w.id),
      },
      aggregateId: dashboard.id,
      occurredAt: new Date(),
    });

    return dashboard;
  }

  addWidget(widget: Omit<DashboardWidget, 'id'>): void {
    const newWidget: DashboardWidget = {
      ...widget,
      id: crypto.randomUUID(),
    };

    // Validate position doesn't overlap
    if (this.hasPositionOverlap(newWidget.position)) {
      throw new Error('Widget position overlaps with existing widget');
    }

    this.props.widgets.push(newWidget);
    this.props.updatedAt = new Date();
  }

  updateWidget(
    widgetId: string,
    updates: Partial<Omit<DashboardWidget, 'id'>>,
  ): void {
    const widgetIndex = this.props.widgets.findIndex((w) => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new Error('Widget not found');
    }

    const updatedWidget = { ...this.props.widgets[widgetIndex], ...updates };

    // Validate position if it's being updated
    if (
      updates.position &&
      this.hasPositionOverlap(updates.position, widgetId)
    ) {
      throw new Error('Widget position overlaps with existing widget');
    }

    this.props.widgets[widgetIndex] = updatedWidget;
    this.props.updatedAt = new Date();
  }

  removeWidget(widgetId: string): void {
    const widgetIndex = this.props.widgets.findIndex((w) => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new Error('Widget not found');
    }

    this.props.widgets.splice(widgetIndex, 1);
    this.props.updatedAt = new Date();
  }

  reorderWidgets(newOrder: string[]): void {
    if (newOrder.length !== this.props.widgets.length) {
      throw new Error('New order must include all widgets');
    }

    const reorderedWidgets: DashboardWidget[] = [];
    for (const widgetId of newOrder) {
      const widget = this.props.widgets.find((w) => w.id === widgetId);
      if (!widget) {
        throw new Error(`Widget ${widgetId} not found`);
      }
      reorderedWidgets.push(widget);
    }

    this.props.widgets = reorderedWidgets;
    this.props.updatedAt = new Date();
  }

  setAsDefault(): void {
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  private hasPositionOverlap(
    position: DashboardWidget['position'],
    excludeWidgetId?: string,
  ): boolean {
    return this.props.widgets.some((widget) => {
      if (excludeWidgetId && widget.id === excludeWidgetId) {
        return false;
      }

      const widgetPos = widget.position;
      return !(
        position.x >= widgetPos.x + widgetPos.width ||
        position.x + position.width <= widgetPos.x ||
        position.y >= widgetPos.y + widgetPos.height ||
        position.y + position.height <= widgetPos.y
      );
    });
  }

  // Computed properties
  get widgetCount(): number {
    return this.props.widgets.length;
  }

  get hasWidgets(): boolean {
    return this.props.widgets.length > 0;
  }

  getWidgetsByType(type: DashboardWidget['type']): DashboardWidget[] {
    return this.props.widgets.filter((widget) => widget.type === type);
  }

  getWidgetsByReportType(reportType: ReportType): DashboardWidget[] {
    return this.props.widgets.filter(
      (widget) => widget.reportType === reportType,
    );
  }
}
