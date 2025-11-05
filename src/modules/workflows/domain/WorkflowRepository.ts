import { Workflow, TriggerType, ActionType } from './Workflow';

export interface WorkflowFilters {
  search?: string;
  triggerType?: TriggerType;
  isActive?: boolean;
  hasSchedule?: boolean;
}

export interface WorkflowRepository {
  // Basic CRUD operations
  save(workflow: Workflow): Promise<void>;
  update(workflow: Workflow): Promise<void>;
  findById(id: string, tenantId: string): Promise<Workflow | null>;
  delete(id: string, tenantId: string): Promise<void>;

  // Query operations
  findAll(
    tenantId: string,
    filters?: WorkflowFilters,
    pagination?: { page: number; limit: number },
  ): Promise<{
    workflows: Workflow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  findByTriggerType(
    triggerType: TriggerType,
    tenantId: string,
  ): Promise<Workflow[]>;
  findActiveWorkflows(tenantId: string): Promise<Workflow[]>;
  findScheduledWorkflows(tenantId: string): Promise<Workflow[]>;
  findByActionType(
    actionType: ActionType,
    tenantId: string,
  ): Promise<Workflow[]>;
}

export interface WorkflowExecutionService {
  // Execution management
  executeWorkflow(
    workflowId: string,
    triggerData: Record<string, unknown>,
    tenantId: string,
  ): Promise<{
    executionId: string;
    success: boolean;
    actionsExecuted: number;
    errors: string[];
  }>;

  executeWorkflowAction(
    action: Record<string, unknown>,
    context: Record<string, unknown>,
    tenantId: string,
  ): Promise<{
    success: boolean;
    result?: unknown;
    error?: string;
  }>;

  getExecutionHistory(
    workflowId: string,
    tenantId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    executions: Array<{
      executionId: string;
      startedAt: Date;
      completedAt?: Date;
      success: boolean;
      triggerData: Record<string, unknown>;
      actionsExecuted: number;
      errors: string[];
      duration?: number;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  getExecutionStatistics(
    workflowId: string,
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    averageDuration: number;
    executionsByDay: Array<{
      date: Date;
      executions: number;
      successes: number;
      failures: number;
    }>;
  }>;
}

export interface WorkflowTriggerService {
  // Trigger management
  registerTrigger(
    triggerType: TriggerType,
    workflowId: string,
    tenantId: string,
  ): Promise<void>;

  unregisterTrigger(
    triggerType: TriggerType,
    workflowId: string,
    tenantId: string,
  ): Promise<void>;

  triggerWorkflows(
    triggerType: TriggerType,
    triggerData: Record<string, unknown>,
    tenantId: string,
  ): Promise<{
    triggered: number;
    successful: number;
    failed: number;
    errors: Array<{
      workflowId: string;
      error: string;
    }>;
  }>;

  // Event handlers
  handleAppointmentCreated(
    appointmentData: Record<string, unknown>,
    tenantId: string,
  ): Promise<void>;
  handleAppointmentCompleted(
    appointmentData: Record<string, unknown>,
    tenantId: string,
  ): Promise<void>;
  handleAppointmentCancelled(
    appointmentData: Record<string, unknown>,
    tenantId: string,
  ): Promise<void>;
  handleClientCreated(
    clientData: Record<string, unknown>,
    tenantId: string,
  ): Promise<void>;
  handleSaleCompleted(
    saleData: Record<string, unknown>,
    tenantId: string,
  ): Promise<void>;
  handleReviewReceived(
    reviewData: Record<string, unknown>,
    tenantId: string,
  ): Promise<void>;
  handleStockLow(
    productData: Record<string, unknown>,
    tenantId: string,
  ): Promise<void>;
}

export interface WorkflowSchedulingService {
  // Schedule management
  scheduleWorkflow(workflowId: string, tenantId: string): Promise<void>;
  unscheduleWorkflow(workflowId: string, tenantId: string): Promise<void>;

  getScheduledWorkflows(tenantId: string): Promise<
    Array<{
      workflowId: string;
      workflowName: string;
      nextRunAt: Date;
      lastRunAt?: Date;
      isActive: boolean;
    }>
  >;

  executeScheduledWorkflows(tenantId?: string): Promise<{
    executed: number;
    successful: number;
    failed: number;
  }>;

  updateSchedule(
    workflowId: string,
    schedule: Record<string, unknown>,
    tenantId: string,
  ): Promise<void>;
}

export interface WorkflowTemplateService {
  // Pre-built workflow templates
  getTemplates(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      category:
        | 'APPOINTMENT'
        | 'MARKETING'
        | 'CLIENT_CARE'
        | 'SALES'
        | 'INVENTORY';
      triggerType: TriggerType;
      actions: unknown[];
      isPopular: boolean;
    }>
  >;

  createWorkflowFromTemplate(
    templateId: string,
    customization: {
      name: string;
      description?: string;
      customActions?: unknown[];
      customConditions?: unknown[];
    },
    tenantId: string,
  ): Promise<string>;

  // Common templates
  createAppointmentReminderWorkflow(
    hoursBeforeReminder: number,
    messageTemplate: string,
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP',
    tenantId: string,
  ): Promise<string>;

  createBirthdayReminderWorkflow(
    daysBefore: number,
    messageTemplate: string,
    tenantId: string,
    discountPercentage?: number,
  ): Promise<string>;

  createFollowUpWorkflow(
    daysAfterAppointment: number,
    messageTemplate: string,
    requestReview: boolean,
    tenantId: string,
  ): Promise<string>;

  createLowStockAlertWorkflow(
    alertChannel: 'EMAIL' | 'NOTIFICATION',
    recipients: string[],
    tenantId: string,
  ): Promise<string>;

  createNewClientWelcomeWorkflow(
    welcomeMessageTemplate: string,
    tenantId: string,
    discountOffer?: {
      percentage: number;
      validDays: number;
    },
  ): Promise<string>;
}

export interface WorkflowAnalyticsService {
  getWorkflowStatistics(tenantId: string): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
    popularTriggerTypes: Array<{
      triggerType: TriggerType;
      workflowCount: number;
      executionCount: number;
    }>;
    popularActionTypes: Array<{
      actionType: ActionType;
      usageCount: number;
    }>;
  }>;

  getWorkflowPerformance(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<
    Array<{
      workflowId: string;
      workflowName: string;
      executions: number;
      successRate: number;
      averageDuration: number;
      lastExecuted?: Date;
      efficiency: number; // Success rate * execution frequency
    }>
  >;

  getAutomationROI(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalAutomations: number;
    timeSaved: number; // Estimated hours saved
    costSavings: number; // Estimated monetary savings
    revenueGenerated: number; // Revenue attributed to automations
    roi: number; // Return on investment percentage
    topPerformingWorkflows: Array<{
      workflowId: string;
      workflowName: string;
      revenueGenerated: number;
      timeSaved: number;
    }>;
  }>;

  exportWorkflowReport(
    tenantId: string,
    workflowId?: string,
    dateFrom?: Date,
    dateTo?: Date,
    format?: 'CSV' | 'EXCEL' | 'PDF',
  ): Promise<Buffer>;
}

export interface WorkflowValidationService {
  validateWorkflow(workflow: Workflow): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  validateTrigger(trigger: Record<string, unknown>): Promise<{
    isValid: boolean;
    errors: string[];
  }>;

  validateAction(action: Record<string, unknown>): Promise<{
    isValid: boolean;
    errors: string[];
    requiredFields: string[];
  }>;

  validateConditions(conditions: Record<string, unknown>[]): Promise<{
    isValid: boolean;
    errors: string[];
  }>;

  testWorkflow(
    workflowId: string,
    testData: Record<string, unknown>,
    tenantId: string,
  ): Promise<{
    canExecute: boolean;
    conditionResults: Array<{
      condition: string;
      result: boolean;
    }>;
    predictedActions: Array<{
      actionType: ActionType;
      willExecute: boolean;
      reason?: string;
    }>;
  }>;
}
