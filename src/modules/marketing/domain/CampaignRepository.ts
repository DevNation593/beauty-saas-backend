import {
  Campaign,
  CampaignStatus,
  CampaignType,
  MessageChannel,
  ClientSegment,
} from './Campaign';

export interface CampaignFilters {
  search?: string; // Search by name or description
  type?: CampaignType;
  status?: CampaignStatus;
  channel?: MessageChannel;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CampaignSortOptions {
  field:
    | 'name'
    | 'type'
    | 'status'
    | 'createdAt'
    | 'scheduledAt'
    | 'metrics.totalSent';
  order: 'asc' | 'desc';
}

export interface CampaignRepository {
  // Basic CRUD operations
  save(campaign: Campaign): Promise<void>;
  update(campaign: Campaign): Promise<void>;
  findById(id: string, tenantId: string): Promise<Campaign | null>;
  delete(id: string, tenantId: string): Promise<void>;

  // Query operations
  findAll(
    tenantId: string,
    filters?: CampaignFilters,
    sort?: CampaignSortOptions,
    pagination?: { page: number; limit: number },
  ): Promise<{
    campaigns: Campaign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  findByStatus(status: CampaignStatus, tenantId: string): Promise<Campaign[]>;
  findByType(type: CampaignType, tenantId: string): Promise<Campaign[]>;
  findScheduledCampaigns(
    beforeDate: Date,
    tenantId: string,
  ): Promise<Campaign[]>;
  findOverdueCampaigns(tenantId: string): Promise<Campaign[]>;

  // Analytics and reports
  getCampaignMetrics(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalMessagesSent: number;
    averageDeliveryRate: number;
    averageOpenRate: number;
    averageClickRate: number;
    averageConversionRate: number;
  }>;

  getTopPerformingCampaigns(
    tenantId: string,
    metric: 'deliveryRate' | 'openRate' | 'clickRate' | 'conversionRate',
    limit?: number,
  ): Promise<
    Array<{
      campaign: Campaign;
      metricValue: number;
    }>
  >;

  getCampaignPerformanceByType(tenantId: string): Promise<
    Array<{
      type: CampaignType;
      campaignCount: number;
      totalSent: number;
      averageDeliveryRate: number;
      averageOpenRate: number;
      averageClickRate: number;
      averageConversionRate: number;
    }>
  >;

  getCampaignPerformanceByChannel(tenantId: string): Promise<
    Array<{
      channel: MessageChannel;
      campaignCount: number;
      totalSent: number;
      averageDeliveryRate: number;
      averageOpenRate: number;
      averageClickRate: number;
      averageConversionRate: number;
    }>
  >;
}

export interface SegmentationService {
  validateSegment(segment: ClientSegment, tenantId: string): Promise<boolean>;

  getSegmentSize(segment: ClientSegment, tenantId: string): Promise<number>;

  getSegmentPreview(
    segment: ClientSegment,
    tenantId: string,
    limit?: number,
  ): Promise<
    Array<{
      clientId: string;
      name: string;
      email?: string;
      phone?: string;
    }>
  >;

  getPreBuiltSegments(tenantId: string): Promise<
    Array<{
      name: string;
      description: string;
      segment: ClientSegment;
      clientCount: number;
    }>
  >;

  saveSegment(
    name: string,
    description: string,
    segment: ClientSegment,
    tenantId: string,
  ): Promise<void>;

  getSavedSegments(tenantId: string): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      segment: ClientSegment;
      clientCount: number;
      createdAt: Date;
    }>
  >;

  deleteSegment(segmentId: string, tenantId: string): Promise<void>;
}

export interface TemplateService {
  getTemplates(
    tenantId: string,
    channel?: MessageChannel,
    type?: CampaignType,
  ): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      channel: MessageChannel;
      type: CampaignType;
      subject?: string; // For email templates
      content: string;
      variables: string[]; // List of required variables
      isDefault: boolean;
      createdAt: Date;
    }>
  >;

  createTemplate(data: {
    name: string;
    description?: string;
    channel: MessageChannel;
    type: CampaignType;
    subject?: string;
    content: string;
    tenantId: string;
  }): Promise<string>;

  updateTemplate(
    templateId: string,
    data: {
      name?: string;
      description?: string;
      subject?: string;
      content?: string;
    },
    tenantId: string,
  ): Promise<void>;

  deleteTemplate(templateId: string, tenantId: string): Promise<void>;

  validateTemplate(
    content: string,
    variables: Record<string, any>,
  ): Promise<{
    isValid: boolean;
    missingVariables: string[];
    unusedVariables: string[];
  }>;

  renderTemplate(
    templateId: string,
    variables: Record<string, any>,
    tenantId: string,
  ): Promise<{
    subject?: string;
    content: string;
  }>;
}

export interface MessageDeliveryService {
  sendMessage(data: {
    campaignId?: string;
    channel: MessageChannel;
    recipient: {
      email?: string;
      phone?: string;
      name: string;
    };
    content: {
      subject?: string;
      body: string;
    };
    scheduledAt?: Date;
    tenantId: string;
  }): Promise<{
    messageId: string;
    providerMessageId?: string;
    status: 'SENT' | 'SCHEDULED' | 'FAILED';
    errorMessage?: string;
  }>;

  getMessageStatus(
    messageId: string,
    tenantId: string,
  ): Promise<{
    messageId: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'FAILED';
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    errorMessage?: string;
  }>;

  getMessageHistory(
    campaignId: string,
    tenantId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    messages: Array<{
      messageId: string;
      recipientName: string;
      recipientEmail?: string;
      recipientPhone?: string;
      status: string;
      sentAt?: Date;
      deliveredAt?: Date;
      openedAt?: Date;
      clickedAt?: Date;
      errorMessage?: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  resendFailedMessages(
    campaignId: string,
    tenantId: string,
  ): Promise<{
    resent: number;
    failed: number;
  }>;

  cancelScheduledMessages(
    campaignId: string,
    tenantId: string,
  ): Promise<number>;
}

export interface AutomationService {
  createBirthdayReminder(
    daysBefore: number,
    template: string,
    channel: MessageChannel,
    tenantId: string,
  ): Promise<void>;

  createAppointmentReminder(
    hoursBefore: number,
    template: string,
    channel: MessageChannel,
    tenantId: string,
  ): Promise<void>;

  createFollowUpCampaign(
    daysAfter: number,
    template: string,
    channel: MessageChannel,
    targetSegment: ClientSegment,
    tenantId: string,
  ): Promise<void>;

  createRetentionCampaign(
    daysWithoutVisit: number,
    template: string,
    channel: MessageChannel,
    tenantId: string,
  ): Promise<void>;

  getActiveAutomations(tenantId: string): Promise<
    Array<{
      id: string;
      type: 'BIRTHDAY' | 'APPOINTMENT_REMINDER' | 'FOLLOW_UP' | 'RETENTION';
      name: string;
      isActive: boolean;
      triggerConditions: Record<string, any>;
      template: string;
      channel: MessageChannel;
      createdAt: Date;
      lastRunAt?: Date;
      nextRunAt?: Date;
    }>
  >;

  pauseAutomation(automationId: string, tenantId: string): Promise<void>;
  resumeAutomation(automationId: string, tenantId: string): Promise<void>;
  deleteAutomation(automationId: string, tenantId: string): Promise<void>;
}

export interface CampaignAnalyticsService {
  getCampaignROI(
    campaignId: string,
    tenantId: string,
  ): Promise<{
    campaignCost: number;
    revenue: number;
    conversions: number;
    roi: number;
    costPerConversion: number;
  }>;

  getAudienceInsights(tenantId: string): Promise<{
    totalContacts: number;
    emailContacts: number;
    phoneContacts: number;
    preferredChannels: Record<MessageChannel, number>;
    segmentDistribution: Record<string, number>;
    engagementTrends: Array<{
      date: Date;
      opens: number;
      clicks: number;
      conversions: number;
    }>;
  }>;

  getChannelPerformance(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<
    Array<{
      channel: MessageChannel;
      messagesSent: number;
      deliveryRate: number;
      openRate: number;
      clickRate: number;
      conversionRate: number;
      averageCost: number;
      totalRevenue: number;
      roi: number;
    }>
  >;

  exportCampaignReport(
    campaignId: string,
    tenantId: string,
    format: 'CSV' | 'EXCEL' | 'PDF',
  ): Promise<Buffer>;

  exportAnalyticsReport(
    tenantId: string,
    dateFrom: Date,
    dateTo: Date,
    format: 'CSV' | 'EXCEL' | 'PDF',
  ): Promise<Buffer>;
}
