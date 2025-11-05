import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GraphQLAuthGuard } from '../guards/graphql-auth.guard';
import { GraphQLRoleGuard } from '../guards/graphql-role.guard';
import { Roles } from '../../../common/auth/rbac/roles.decorator';
import { UserRole } from '../../../modules/identity-tenancy/domain/User';
import {
  CreateTenantCommand,
  UpdateTenantCommand,
  UpdateTenantStatusCommand,
  UpdateTenantSubscriptionCommand,
  ExtendTenantTrialCommand,
  DeleteTenantCommand,
} from '../../../modules/admin/application/commands/TenantCommandHandlers';
import {
  GetTenantByIdQuery,
  GetTenantBySlugQuery,
  GetTenantByEmailQuery,
  GetTenantByDomainQuery,
  GetAllTenantsQuery,
  GetTenantAnalyticsQuery,
} from '../../../modules/admin/application/queries/TenantQueryHandlers';
import { Tenant } from '../../../modules/admin/domain/Tenant';
import {
  TenantType,
  TenantAnalyticsType,
  CreateTenantInput,
  UpdateTenantInput,
  UpdateTenantStatusInput,
  UpdateTenantSubscriptionInput,
  ExtendTenantTrialInput,
  TenantFilterInput,
} from '../types/admin.types';

@Resolver(() => TenantType)
@UseGuards(GraphQLAuthGuard, GraphQLRoleGuard)
@Roles(UserRole.OWNER)
export class AdminResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Mutation(() => TenantType)
  async createTenant(
    @Args('input') input: CreateTenantInput,
  ): Promise<TenantType> {
    const command = new CreateTenantCommand(
      input.name,
      input.slug,
      input.email,
      input.phone,
      input.address,
      input.city,
      input.state,
      input.country,
      input.timezone || 'UTC',
      input.locale || 'en',
      input.planId,
      input.features || [],
      input.domain,
      input.billingEmail,
      input.taxId,
    );

    const tenant: Tenant = await this.commandBus.execute(command);
    return this.mapToTenantType(tenant);
  }

  @Query(() => [TenantType])
  async getAllTenants(
    @Args('filters', { nullable: true }) filters?: TenantFilterInput,
  ): Promise<TenantType[]> {
    const query = new GetAllTenantsQuery(
      filters?.status,
      filters?.planId,
      filters?.page,
      filters?.limit,
    );

    const tenants: Tenant[] = await this.queryBus.execute(query);
    return tenants.map((tenant) => this.mapToTenantType(tenant));
  }

  @Query(() => TenantAnalyticsType)
  async getTenantAnalytics(): Promise<TenantAnalyticsType> {
    const query = new GetTenantAnalyticsQuery();
    return this.queryBus.execute(query);
  }

  @Query(() => TenantType, { nullable: true })
  async getTenantById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<TenantType | null> {
    const query = new GetTenantByIdQuery(id);
    const tenant: Tenant | null = await this.queryBus.execute(query);
    return tenant ? this.mapToTenantType(tenant) : null;
  }

  @Query(() => TenantType, { nullable: true })
  async getTenantBySlug(
    @Args('slug') slug: string,
  ): Promise<TenantType | null> {
    const query = new GetTenantBySlugQuery(slug);
    const tenant: Tenant | null = await this.queryBus.execute(query);
    return tenant ? this.mapToTenantType(tenant) : null;
  }

  @Query(() => TenantType, { nullable: true })
  async getTenantByEmail(
    @Args('email') email: string,
  ): Promise<TenantType | null> {
    const query = new GetTenantByEmailQuery(email);
    const tenant: Tenant | null = await this.queryBus.execute(query);
    return tenant ? this.mapToTenantType(tenant) : null;
  }

  @Query(() => TenantType, { nullable: true })
  async getTenantByDomain(
    @Args('domain') domain: string,
  ): Promise<TenantType | null> {
    const query = new GetTenantByDomainQuery(domain);
    const tenant: Tenant | null = await this.queryBus.execute(query);
    return tenant ? this.mapToTenantType(tenant) : null;
  }

  @Mutation(() => TenantType)
  async updateTenant(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTenantInput,
  ): Promise<TenantType> {
    const command = new UpdateTenantCommand(
      id,
      input.name,
      input.email,
      input.phone,
      input.address,
      input.city,
      input.state,
      input.country,
      input.timezone,
      input.locale,
      input.domain,
      input.logoUrl,
      input.billingEmail,
      input.taxId,
    );

    const tenant: Tenant = await this.commandBus.execute(command);
    return this.mapToTenantType(tenant);
  }

  @Mutation(() => Boolean)
  async updateTenantStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTenantStatusInput,
  ): Promise<boolean> {
    const command = new UpdateTenantStatusCommand(
      id,
      input.status,
      input.reason,
    );

    await this.commandBus.execute(command);
    return true;
  }

  @Mutation(() => Boolean)
  async updateTenantSubscription(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTenantSubscriptionInput,
  ): Promise<boolean> {
    const command = new UpdateTenantSubscriptionCommand(
      id,
      input.planId,
      input.endDate ? new Date(input.endDate) : undefined,
    );

    await this.commandBus.execute(command);
    return true;
  }

  @Mutation(() => Boolean)
  async extendTenantTrial(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ExtendTenantTrialInput,
  ): Promise<boolean> {
    const command = new ExtendTenantTrialCommand(id, input.days);
    await this.commandBus.execute(command);
    return true;
  }

  @Mutation(() => Boolean)
  async deleteTenant(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const command = new DeleteTenantCommand(id);
    await this.commandBus.execute(command);
    return true;
  }

  private mapToTenantType(tenant: Tenant): TenantType {
    const props = tenant.getProps();
    return {
      id: props.id,
      name: props.name,
      slug: props.slug,
      email: props.email,
      phone: props.phone,
      address: props.address,
      city: props.city,
      state: props.state,
      country: props.country,
      timezone: props.timezone,
      locale: props.locale,
      planId: props.planId,
      status: props.status,
      domain: props.domain,
      subscriptionStartDate: props.subscriptionStartDate,
      subscriptionEndDate: props.subscriptionEndDate,
      trialEndDate: props.trialEndDate,
      maxUsers: props.maxUsers,
      maxClients: props.maxClients,
      maxLocations: props.maxLocations,
      features: props.features,
      logoUrl: props.logoUrl,
      billingEmail: props.billingEmail,
      taxId: props.taxId,
      isActive: props.isActive,
      settings: JSON.stringify(props.settings),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
