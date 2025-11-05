import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  // ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import { RoleGuard } from '../../../common/auth/rbac/role.guard';
import { Roles } from '../../../common/auth/rbac/roles.decorator';
import { UserRole } from '../../identity-tenancy/domain/User';
import {
  CreateTenantDto,
  UpdateTenantDto,
  UpdateTenantStatusDto,
  UpdateTenantSubscriptionDto,
  ExtendTenantTrialDto,
  TenantResponseDto,
  TenantFilterDto,
  BulkUpdateStatusDto,
  TenantAnalyticsResponseDto,
} from './dto/tenant.dto';
import {
  CreateTenantCommand,
  UpdateTenantCommand,
  UpdateTenantStatusCommand,
  UpdateTenantSubscriptionCommand,
  ExtendTenantTrialCommand,
  DeleteTenantCommand,
} from '../application/commands/TenantCommandHandlers';
import {
  GetTenantByIdQuery,
  GetTenantBySlugQuery,
  GetTenantByEmailQuery,
  GetTenantByDomainQuery,
  GetAllTenantsQuery,
  GetTenantAnalyticsQuery,
} from '../application/queries/TenantQueryHandlers';
import { Tenant, TenantStatus } from '../domain/Tenant';

// @ApiTags('Admin - Tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
@UseGuards(SupabaseAuthGuard, RoleGuard)
@Roles(UserRole.OWNER)
export class AdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, type: TenantResponseDto })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    const command = new CreateTenantCommand(
      createTenantDto.name,
      createTenantDto.slug,
      createTenantDto.email,
      createTenantDto.phone,
      createTenantDto.address,
      createTenantDto.city,
      createTenantDto.state,
      createTenantDto.country,
      createTenantDto.timezone || 'UTC',
      createTenantDto.locale || 'en',
      createTenantDto.planId,
      createTenantDto.features || [],
      createTenantDto.domain,
      createTenantDto.billingEmail,
      createTenantDto.taxId,
    );

    const tenant: Tenant = await this.commandBus.execute(command);
    return this.mapToResponseDto(tenant);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants with filters' })
  @ApiResponse({ status: 200, type: [TenantResponseDto] })
  async getAllTenants(
    @Query() filters: TenantFilterDto,
  ): Promise<TenantResponseDto[]> {
    const query = new GetAllTenantsQuery(
      filters.status,
      filters.planId,
      filters.page,
      filters.limit,
    );

    const tenants: Tenant[] = await this.queryBus.execute(query);
    return tenants.map((tenant) => this.mapToResponseDto(tenant));
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get tenant analytics' })
  @ApiResponse({ status: 200, type: TenantAnalyticsResponseDto })
  async getTenantAnalytics(): Promise<TenantAnalyticsResponseDto> {
    const query = new GetTenantAnalyticsQuery();
    return this.queryBus.execute(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantBySlug(
    @Param('slug') slug: string,
  ): Promise<TenantResponseDto> {
    const query = new GetTenantBySlugQuery(slug);
    const tenant: Tenant | null = await this.queryBus.execute(query);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.mapToResponseDto(tenant);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get tenant by email' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantByEmail(
    @Param('email') email: string,
  ): Promise<TenantResponseDto> {
    const query = new GetTenantByEmailQuery(email);
    const tenant: Tenant | null = await this.queryBus.execute(query);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.mapToResponseDto(tenant);
  }

  @Get('domain/:domain')
  @ApiOperation({ summary: 'Get tenant by domain' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantByDomain(
    @Param('domain') domain: string,
  ): Promise<TenantResponseDto> {
    const query = new GetTenantByDomainQuery(domain);
    const tenant: Tenant | null = await this.queryBus.execute(query);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.mapToResponseDto(tenant);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantById(@Param('id') id: string): Promise<TenantResponseDto> {
    const query = new GetTenantByIdQuery(id);
    const tenant: Tenant | null = await this.queryBus.execute(query);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.mapToResponseDto(tenant);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenant(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    const command = new UpdateTenantCommand(
      id,
      updateTenantDto.name,
      updateTenantDto.email,
      updateTenantDto.phone,
      updateTenantDto.address,
      updateTenantDto.city,
      updateTenantDto.state,
      updateTenantDto.country,
      updateTenantDto.timezone,
      updateTenantDto.locale,
      updateTenantDto.domain,
      updateTenantDto.logoUrl,
      updateTenantDto.billingEmail,
      updateTenantDto.taxId,
    );

    const tenant: Tenant = await this.commandBus.execute(command);
    return this.mapToResponseDto(tenant);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update tenant status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTenantStatusDto,
  ): Promise<void> {
    const command = new UpdateTenantStatusCommand(
      id,
      updateStatusDto.status,
      updateStatusDto.reason,
    );

    await this.commandBus.execute(command);
  }

  @Put(':id/subscription')
  @ApiOperation({ summary: 'Update tenant subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenantSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateTenantSubscriptionDto,
  ): Promise<void> {
    const command = new UpdateTenantSubscriptionCommand(
      id,
      updateSubscriptionDto.planId,
      updateSubscriptionDto.endDate
        ? new Date(updateSubscriptionDto.endDate)
        : undefined,
    );

    await this.commandBus.execute(command);
  }

  @Put(':id/trial/extend')
  @ApiOperation({ summary: 'Extend tenant trial' })
  @ApiResponse({ status: 200, description: 'Trial extended successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async extendTenantTrial(
    @Param('id') id: string,
    @Body() extendTrialDto: ExtendTenantTrialDto,
  ): Promise<void> {
    const command = new ExtendTenantTrialCommand(id, extendTrialDto.days);
    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async deleteTenant(@Param('id') id: string): Promise<void> {
    const command = new DeleteTenantCommand(id);
    await this.commandBus.execute(command);
  }

  private mapToResponseDto(tenant: Tenant): TenantResponseDto {
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
      settings: props.settings,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
