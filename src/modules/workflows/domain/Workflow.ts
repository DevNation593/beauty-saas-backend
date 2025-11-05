import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export interface WorkflowCreatedEvent extends DomainEvent {
  type: 'WorkflowCreated';
  payload: {
    workflowId: string;
    tenantId: string;
    name: string;
    triggerType: TriggerType;
  };
}

export interface WorkflowExecutedEvent extends DomainEvent {
  type: 'WorkflowExecuted';
  payload: {
    workflowId: string;
    tenantId: string;
    executionId: string;
    triggerData: Record<string, unknown>;
    actionsExecuted: number;
    success: boolean;
  };
}

export interface WorkflowFailedEvent extends DomainEvent {
  type: 'WorkflowFailed';
  payload: {
    workflowId: string;
    tenantId: string;
    executionId: string;
    error: string;
    triggerData: Record<string, unknown>;
  };
}

export type TriggerType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_CANCELLED'
  | 'CLIENT_CREATED'
  | 'CLIENT_BIRTHDAY'
  | 'SALE_COMPLETED'
  | 'REVIEW_RECEIVED'
  | 'STOCK_LOW'
  | 'SCHEDULED'
  | 'WEBHOOK';

export type ActionType =
  | 'SEND_EMAIL'
  | 'SEND_SMS'
  | 'SEND_WHATSAPP'
  | 'CREATE_TASK'
  | 'UPDATE_CLIENT'
  | 'CREATE_APPOINTMENT'
  | 'SEND_REVIEW_REQUEST'
  | 'ADD_CLIENT_TAG'
  | 'WEBHOOK_CALL'
  | 'WAIT_DELAY';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export interface TriggerCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface WorkflowTrigger {
  type: TriggerType;
  conditions: TriggerCondition[];
  schedule?: {
    type: 'ONCE' | 'RECURRING';
    date?: Date;
    interval?: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
    intervalValue?: number;
    cronExpression?: string;
  };
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  order: number;
  config: Record<string, unknown>;
  conditions?: TriggerCondition[];
  delay?: {
    value: number;
    unit: 'MINUTES' | 'HOURS' | 'DAYS';
  };
}

export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface WorkflowProps {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Workflow extends BaseEntity {
  private props: WorkflowProps;

  constructor(props: WorkflowProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
  }

  // Getters
  get workflowId(): string {
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

  get trigger(): WorkflowTrigger {
    return this.props.trigger;
  }

  get actions(): WorkflowAction[] {
    return this.props.actions;
  }

  get conditions(): WorkflowCondition[] {
    return this.props.conditions;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  // Business methods
  static create(data: {
    name: string;
    description?: string;
    tenantId: string;
    trigger: WorkflowTrigger;
    actions: Omit<WorkflowAction, 'id'>[];
    conditions?: WorkflowCondition[];
  }): Workflow {
    // Validations
    if (!data.name?.trim()) {
      throw new Error('Workflow name is required');
    }

    if (!data.actions || data.actions.length === 0) {
      throw new Error('Workflow must have at least one action');
    }

    // Validate actions order
    const orders = data.actions.map((a) => a.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      throw new Error('Action orders must be unique');
    }

    // Generate action IDs and sort by order
    const actionsWithIds: WorkflowAction[] = data.actions
      .map((action) => ({
        ...action,
        id: crypto.randomUUID(),
      }))
      .sort((a, b) => a.order - b.order);

    const workflow = new Workflow({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description?.trim(),
      tenantId: data.tenantId,
      trigger: data.trigger,
      actions: actionsWithIds,
      conditions: data.conditions ?? [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    workflow.addDomainEvent({
      type: 'WorkflowCreated',
      payload: {
        workflowId: workflow.id,
        tenantId: workflow.tenantId,
        name: workflow.name,
        triggerType: workflow.trigger.type,
      },
      aggregateId: workflow.id,
      occurredAt: new Date(),
    });

    return workflow;
  }

  updateDetails(data: { name?: string; description?: string }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Workflow name cannot be empty');
      }
      this.props.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.props.description = data.description.trim() || undefined;
    }

    this.props.updatedAt = new Date();
  }

  updateTrigger(trigger: WorkflowTrigger): void {
    this.validateTrigger(trigger);
    this.props.trigger = trigger;
    this.props.updatedAt = new Date();
  }

  addAction(action: Omit<WorkflowAction, 'id'>): void {
    // Check for duplicate order
    if (this.props.actions.some((a) => a.order === action.order)) {
      throw new Error('Action order already exists');
    }

    const newAction: WorkflowAction = {
      ...action,
      id: crypto.randomUUID(),
    };

    this.props.actions.push(newAction);
    this.props.actions.sort((a, b) => a.order - b.order);
    this.props.updatedAt = new Date();
  }

  updateAction(
    actionId: string,
    updates: Partial<Omit<WorkflowAction, 'id'>>,
  ): void {
    const actionIndex = this.props.actions.findIndex((a) => a.id === actionId);
    if (actionIndex === -1) {
      throw new Error('Action not found');
    }

    // Check for duplicate order if order is being updated
    if (updates.order !== undefined) {
      const existingAction = this.props.actions.find(
        (a) => a.order === updates.order && a.id !== actionId,
      );
      if (existingAction) {
        throw new Error('Action order already exists');
      }
    }

    this.props.actions[actionIndex] = {
      ...this.props.actions[actionIndex],
      ...updates,
    };

    // Re-sort if order was updated
    if (updates.order !== undefined) {
      this.props.actions.sort((a, b) => a.order - b.order);
    }

    this.props.updatedAt = new Date();
  }

  removeAction(actionId: string): void {
    const actionIndex = this.props.actions.findIndex((a) => a.id === actionId);
    if (actionIndex === -1) {
      throw new Error('Action not found');
    }

    this.props.actions.splice(actionIndex, 1);
    this.props.updatedAt = new Date();
  }

  reorderActions(
    actionOrders: Array<{ actionId: string; order: number }>,
  ): void {
    // Validate all actions exist
    for (const { actionId } of actionOrders) {
      if (!this.props.actions.find((a) => a.id === actionId)) {
        throw new Error(`Action ${actionId} not found`);
      }
    }

    // Update orders
    for (const { actionId, order } of actionOrders) {
      const action = this.props.actions.find((a) => a.id === actionId);
      if (action) {
        action.order = order;
      }
    }

    // Sort by new order
    this.props.actions.sort((a, b) => a.order - b.order);
    this.props.updatedAt = new Date();
  }

  updateConditions(conditions: WorkflowCondition[]): void {
    this.props.conditions = conditions;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (!this.canBeActivated()) {
      throw new Error('Workflow cannot be activated');
    }

    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // Execution tracking
  recordExecution(
    executionId: string,
    triggerData: Record<string, unknown>,
    success: boolean,
    error?: string,
  ): void {
    if (success) {
      this.addDomainEvent({
        type: 'WorkflowExecuted',
        payload: {
          workflowId: this.id,
          tenantId: this.tenantId,
          executionId,
          triggerData,
          actionsExecuted: this.props.actions.length,
          success: true,
        },
        aggregateId: this.id,
        occurredAt: new Date(),
      });
    } else {
      this.addDomainEvent({
        type: 'WorkflowFailed',
        payload: {
          workflowId: this.id,
          tenantId: this.tenantId,
          executionId,
          error: error ?? 'Unknown error',
          triggerData,
        },
        aggregateId: this.id,
        occurredAt: new Date(),
      });
    }
  }

  // Validation methods
  private validateTrigger(trigger: WorkflowTrigger): void {
    if (trigger.type === 'SCHEDULED' && !trigger.schedule) {
      throw new Error('Scheduled trigger must have schedule configuration');
    }

    if (trigger.schedule) {
      if (trigger.schedule.type === 'ONCE' && !trigger.schedule.date) {
        throw new Error('One-time schedule must have a date');
      }

      if (trigger.schedule.type === 'RECURRING' && !trigger.schedule.interval) {
        throw new Error('Recurring schedule must have an interval');
      }
    }
  }

  // Business rules
  canBeActivated(): boolean {
    return this.props.actions.length > 0;
  }

  canBeTriggered(triggerData: Record<string, unknown>): boolean {
    if (!this.props.isActive) {
      return false;
    }

    // Check trigger conditions
    if (!this.evaluateConditions(this.props.trigger.conditions, triggerData)) {
      return false;
    }

    // Check workflow conditions
    if (!this.evaluateConditions(this.props.conditions, triggerData)) {
      return false;
    }

    return true;
  }

  private evaluateConditions(
    conditions: TriggerCondition[] | WorkflowCondition[],
    data: Record<string, unknown>,
  ): boolean {
    if (conditions.length === 0) {
      return true;
    }

    return conditions.every((condition) =>
      this.evaluateCondition(condition, data),
    );
  }

  private evaluateCondition(
    condition: WorkflowCondition | TriggerCondition,
    data: Record<string, unknown>,
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, data);
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'not_contains':
        return !String(fieldValue).includes(String(value));
      default:
        return false;
    }
  }

  private getFieldValue(field: string, data: Record<string, unknown>): unknown {
    const fieldParts = field.split('.');
    let value: unknown = data;

    for (const f of fieldParts) {
      if (value && typeof value === 'object' && f in value) {
        value = (value as Record<string, unknown>)[f];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // Computed properties
  get hasConditions(): boolean {
    return this.props.conditions.length > 0;
  }

  get hasSchedule(): boolean {
    return this.props.trigger.schedule !== undefined;
  }

  get isScheduled(): boolean {
    return this.props.trigger.type === 'SCHEDULED';
  }

  get actionCount(): number {
    return this.props.actions.length;
  }

  get nextScheduledRun(): Date | undefined {
    if (!this.hasSchedule || !this.props.trigger.schedule) {
      return undefined;
    }

    const schedule = this.props.trigger.schedule;

    if (schedule.type === 'ONCE') {
      return schedule.date;
    }

    // For recurring schedules, this would need more complex logic
    // based on the last execution time and interval
    return undefined;
  }

  getActionsByType(type: ActionType): WorkflowAction[] {
    return this.props.actions.filter((action) => action.type === type);
  }

  hasActionType(type: ActionType): boolean {
    return this.props.actions.some((action) => action.type === type);
  }

  validateActionConfig(action: WorkflowAction): boolean {
    switch (action.type) {
      case 'SEND_EMAIL':
        return !!(
          action.config.to &&
          action.config.subject &&
          action.config.body
        );
      case 'SEND_SMS':
      case 'SEND_WHATSAPP':
        return !!(action.config.to && action.config.message);
      case 'CREATE_TASK':
        return !!(action.config.title && action.config.assignedTo);
      case 'WEBHOOK_CALL':
        return !!(action.config.url && action.config.method);
      case 'WAIT_DELAY':
        return !!(action.delay?.value && action.delay?.unit);
      default:
        return true;
    }
  }

  getProps(): WorkflowProps {
    return { ...this.props };
  }
}
