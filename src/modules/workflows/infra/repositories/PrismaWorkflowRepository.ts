import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import {
  WorkflowRepository,
  WorkflowFilters,
} from '../../domain/WorkflowRepository';
import {
  Workflow,
  TriggerType,
  ActionType,
  WorkflowAction,
  WorkflowCondition,
  TriggerCondition,
} from '../../domain/Workflow';

interface PrismaWorkflowData {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
  trigger: unknown; // JSON field
  actions: unknown; // JSON field
  conditions: unknown; // JSON field
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaWorkflowRepository implements WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(workflow: Workflow): Promise<void> {
    const data = this.toPrismaData(workflow);

    await this.prisma.workflow.upsert({
      where: { id: workflow.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string, tenantId: string): Promise<Workflow | null> {
    const workflowData = await this.prisma.workflow.findFirst({
      where: { id, tenantId },
    });

    return workflowData ? this.toDomain(workflowData) : null;
  }

  async findByTenant(
    tenantId: string,
    filters?: {
      triggerType?: TriggerType;
      search?: string;
    },
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<Workflow[]> {
    const where: Prisma.WorkflowWhereInput = { tenantId };

    if (filters?.triggerType) where.triggerType = filters.triggerType;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const workflows = await this.prisma.workflow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return workflows.map((workflow) => this.toDomain(workflow));
  }

  async findActiveWorkflows(tenantId: string): Promise<Workflow[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      orderBy: { name: 'asc' },
    });

    return workflows.map((workflow) => this.toDomain(workflow));
  }

  async getWorkflowStats(tenantId: string): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    executionsToday: number;
    successRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats, executions, successfulExecutions] = await Promise.all([
      this.prisma.workflow.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      this.prisma.workflowExecution.aggregate({
        where: {
          workflow: { tenantId },
          executedAt: { gte: today },
        },
        _count: {
          _all: true,
        },
      }),
      this.prisma.workflowExecution.count({
        where: {
          workflow: { tenantId },
          executedAt: { gte: today },
          success: true,
        },
      }),
    ]);

    const statusCounts = stats.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalWorkflows: Object.values(statusCounts).reduce(
        (sum: number, count: unknown) => sum + (Number(count) || 0),
        0,
      ),
      activeWorkflows: (statusCounts as any)['ACTIVE'] || 0,
      executionsToday: (executions as any)._count._all || 0,
      successRate:
        executions._count._all > 0
          ? (successfulExecutions / executions._count._all) * 100
          : 0,
    };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.workflow.delete({
      where: { id, tenantId },
    });
  }

  async findAll(
    tenantId: string,
    filters?: WorkflowFilters,
    pagination?: { page: number; limit: number },
  ): Promise<{
    workflows: Workflow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: Prisma.WorkflowWhereInput = { tenantId };

    if (filters) {
      if (filters.triggerType) where.triggerType = filters.triggerType;
      if (filters.isActive !== undefined)
        where.status = filters.isActive ? 'ACTIVE' : 'INACTIVE';
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [workflows, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workflow.count({ where }),
    ]);

    return {
      workflows: workflows.map((w) => this.toDomain(w)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTriggerType(
    triggerType: TriggerType,
    tenantId: string,
  ): Promise<Workflow[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: { tenantId, triggerType },
      orderBy: { createdAt: 'desc' },
    });

    return workflows.map((w) => this.toDomain(w));
  }

  async update(workflow: Workflow): Promise<void> {
    const data = this.toPrismaData(workflow);
    delete data.id;

    await this.prisma.workflow.update({
      where: { id: workflow.id },
      data,
    });
  }

  async findScheduledWorkflows(tenantId: string): Promise<Workflow[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        // Note: In a real implementation, you would check for schedule in triggerConfig
      },
      orderBy: { createdAt: 'desc' },
    });

    return workflows.map((w) => this.toDomain(w));
  }

  async findByActionType(
    actionType: ActionType,
    tenantId: string,
  ): Promise<Workflow[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        tenantId,
        // Note: In a real implementation, you would search inside actions JSON field
      },
      orderBy: { createdAt: 'desc' },
    });

    return workflows.map((w) => this.toDomain(w));
  }

  private toPrismaData(
    workflow: Workflow,
  ): Prisma.WorkflowUncheckedCreateInput {
    const props = workflow.getProps();
    return {
      id: workflow.id,
      name: props.name,
      description: props.description,
      tenantId: props.tenantId,
      triggerType: props.trigger.type,
      triggerConfig: props.trigger as unknown as Prisma.InputJsonValue,
      trigger: props.trigger as unknown as Prisma.InputJsonValue,
      actions: props.actions as unknown as Prisma.InputJsonValue,
      conditions: {} as Prisma.InputJsonValue,
      status: props.isActive ? 'ACTIVE' : 'INACTIVE',
      isActive: props.isActive,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  private toDomain(data: PrismaWorkflowData): Workflow {
    const triggerData = data.trigger as Record<string, unknown>;
    const actionsData = data.actions as unknown[];
    const conditionsData = data.conditions as unknown[];

    return new Workflow({
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      tenantId: data.tenantId,
      trigger: {
        type: (triggerData?.type as TriggerType) || 'MANUAL',
        conditions: (triggerData?.conditions as TriggerCondition[]) || [],
      },
      actions: (actionsData as WorkflowAction[]) || [],
      conditions: (conditionsData as WorkflowCondition[]) || [],
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
