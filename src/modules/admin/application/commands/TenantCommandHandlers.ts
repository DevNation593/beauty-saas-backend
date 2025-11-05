import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { Tenant, TenantStatus, TenantProps } from '../../domain/Tenant';
import type { TenantRepository } from '../../domain/TenantRepository';
import { TENANT_REPOSITORY } from '../../domain/tokens';

// Commands
export class CreateTenantCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly email: string,
    public readonly phone: string | undefined,
    public readonly address: string | undefined,
    public readonly city: string | undefined,
    public readonly state: string | undefined,
    public readonly country: string | undefined,
    public readonly timezone: string,
    public readonly locale: string,
    public readonly planId: string,
    public readonly features: string[],
    public readonly domain: string | undefined,
    public readonly billingEmail: string | undefined,
    public readonly taxId: string | undefined,
  ) {}
}

export class UpdateTenantCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly country?: string,
    public readonly timezone?: string,
    public readonly locale?: string,
    public readonly domain?: string,
    public readonly logoUrl?: string,
    public readonly billingEmail?: string,
    public readonly taxId?: string,
  ) {}
}

export class UpdateTenantStatusCommand {
  constructor(
    public readonly tenantId: string,
    public readonly status: TenantStatus,
    public readonly reason?: string,
  ) {}
}

export class DeleteTenantCommand {
  constructor(public readonly tenantId: string) {}
}

export class UpdateTenantSubscriptionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly planId: string,
    public readonly endDate?: Date,
  ) {}
}

export class ExtendTenantTrialCommand {
  constructor(
    public readonly tenantId: string,
    public readonly days: number,
  ) {}
}

export class BulkUpdateTenantStatusCommand {
  constructor(
    public readonly tenantIds: string[],
    public readonly status: TenantStatus,
    public readonly reason?: string,
  ) {}
}

// Command Handlers
@CommandHandler(CreateTenantCommand)
@Injectable()
export class CreateTenantCommandHandler
  implements ICommandHandler<CreateTenantCommand>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(command: CreateTenantCommand): Promise<Tenant> {
    const tenantProps: Omit<TenantProps, 'id' | 'createdAt' | 'updatedAt'> = {
      name: command.name,
      slug: command.slug,
      email: command.email,
      phone: command.phone,
      address: command.address,
      city: command.city,
      state: command.state,
      country: command.country,
      timezone: command.timezone,
      locale: command.locale,
      planId: command.planId,
      status: TenantStatus.TRIAL,
      domain: command.domain,
      subscriptionStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      maxUsers: 3,
      maxClients: 500,
      maxLocations: 1,
      features: command.features,
      logoUrl: undefined,
      billingEmail: command.billingEmail,
      taxId: command.taxId,
      isActive: true,
      settings: {},
    };

    const tenant = Tenant.create(tenantProps);
    return await this.tenantRepository.create(tenant);
  }
}

@CommandHandler(UpdateTenantCommand)
@Injectable()
export class UpdateTenantCommandHandler
  implements ICommandHandler<UpdateTenantCommand>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(command: UpdateTenantCommand): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(command.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updates: any = {};
    if (command.name !== undefined) updates.name = command.name;
    if (command.email !== undefined) updates.email = command.email;
    if (command.phone !== undefined) updates.phone = command.phone;
    if (command.address !== undefined) updates.address = command.address;
    if (command.city !== undefined) updates.city = command.city;
    if (command.state !== undefined) updates.state = command.state;
    if (command.country !== undefined) updates.country = command.country;
    if (command.timezone !== undefined) updates.timezone = command.timezone;
    if (command.locale !== undefined) updates.locale = command.locale;
    if (command.domain !== undefined) updates.domain = command.domain;
    if (command.logoUrl !== undefined) updates.logoUrl = command.logoUrl;
    if (command.billingEmail !== undefined)
      updates.billingEmail = command.billingEmail;
    if (command.taxId !== undefined) updates.taxId = command.taxId;

    tenant.updateProfile(updates);
    return await this.tenantRepository.update(tenant);
  }
}

@CommandHandler(UpdateTenantStatusCommand)
@Injectable()
export class UpdateTenantStatusCommandHandler
  implements ICommandHandler<UpdateTenantStatusCommand>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(command: UpdateTenantStatusCommand): Promise<void> {
    const tenant = await this.tenantRepository.findById(command.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.updateStatus(command.status, command.reason);
    await this.tenantRepository.update(tenant);
  }
}

@CommandHandler(DeleteTenantCommand)
@Injectable()
export class DeleteTenantCommandHandler
  implements ICommandHandler<DeleteTenantCommand>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(command: DeleteTenantCommand): Promise<void> {
    await this.tenantRepository.delete(command.tenantId);
  }
}

@CommandHandler(UpdateTenantSubscriptionCommand)
@Injectable()
export class UpdateTenantSubscriptionCommandHandler
  implements ICommandHandler<UpdateTenantSubscriptionCommand>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(command: UpdateTenantSubscriptionCommand): Promise<void> {
    const tenant = await this.tenantRepository.findById(command.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.updateSubscription(command.planId, command.endDate);
    await this.tenantRepository.update(tenant);
  }
}

@CommandHandler(ExtendTenantTrialCommand)
@Injectable()
export class ExtendTenantTrialCommandHandler
  implements ICommandHandler<ExtendTenantTrialCommand>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
  ) {}

  async execute(command: ExtendTenantTrialCommand): Promise<void> {
    const tenant = await this.tenantRepository.findById(command.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.extendTrial(command.days);
    await this.tenantRepository.update(tenant);
  }
}

// Export all handlers
export const TenantCommandHandlers = [
  CreateTenantCommandHandler,
  UpdateTenantCommandHandler,
  UpdateTenantStatusCommandHandler,
  DeleteTenantCommandHandler,
  UpdateTenantSubscriptionCommandHandler,
  ExtendTenantTrialCommandHandler,
];
