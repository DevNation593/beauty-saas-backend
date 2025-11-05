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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import { RoleGuard } from '../../../common/auth/rbac/role.guard';
import { Roles } from '../../../common/auth/rbac/roles.decorator';
import { UserRole } from '../../../modules/identity-tenancy/domain/User';
import {
  RestController,
  ApiPaginated,
} from '../decorators/api-version.decorator';
import {
  PaginationDto,
  SearchDto,
  ApiResponseDto,
  PaginatedResponseDto,
} from '../dto/common.dto';

// Import existing DTOs from admin module
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
  TenantFilterDto,
} from '../../../modules/admin/interface/dto/tenant.dto';

// Import commands and queries
import {
  CreateTenantCommand,
  UpdateTenantCommand,
  DeleteTenantCommand,
} from '../../../modules/admin/application/commands/TenantCommandHandlers';
import {
  GetTenantByIdQuery,
  GetAllTenantsQuery,
} from '../../../modules/admin/application/queries/TenantQueryHandlers';
import { Tenant } from '../../../modules/admin/domain/Tenant';

@RestController('Admin Tenants')
@Controller('v1/admin/tenants')
@UseGuards(SupabaseAuthGuard, RoleGuard)
@Roles(UserRole.OWNER)
export class RestAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant via REST API' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: ApiResponseDto<TenantResponseDto>,
  })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<ApiResponseDto<TenantResponseDto>> {
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
    const response = this.mapToResponseDto(tenant);

    return new ApiResponseDto(response, 'Tenant created successfully');
  }

  @Get()
  @ApiPaginated()
  @ApiOperation({ summary: 'Get all tenants with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Tenants retrieved successfully',
    type: PaginatedResponseDto<TenantResponseDto>,
  })
  async getAllTenants(
    @Query() pagination: PaginationDto,
    @Query() filters: TenantFilterDto,
  ): Promise<PaginatedResponseDto<TenantResponseDto>> {
    const query = new GetAllTenantsQuery(
      filters.status,
      filters.planId,
      pagination.page,
      pagination.limit,
    );

    const tenants: Tenant[] = await this.queryBus.execute(query);
    const responseData = tenants.map((tenant) => this.mapToResponseDto(tenant));

    // In a real implementation, you would get the total count from the query
    const total = responseData.length; // This should come from the database query

    return new PaginatedResponseDto(
      responseData,
      pagination.page || 1,
      pagination.limit || 10,
      total,
      'Tenants retrieved successfully',
    );
  }

  @Get('search')
  @ApiPaginated()
  @ApiOperation({ summary: 'Search tenants with advanced filters' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: PaginatedResponseDto<TenantResponseDto>,
  })
  async searchTenants(
    @Query() searchDto: SearchDto,
  ): Promise<PaginatedResponseDto<TenantResponseDto>> {
    // This would use a more advanced search query
    const query = new GetAllTenantsQuery(
      undefined, // status filter
      undefined, // planId filter
      searchDto.page,
      searchDto.limit,
    );

    const tenants: Tenant[] = await this.commandBus.execute(query);
    const responseData = tenants
      .filter(
        (tenant) =>
          !searchDto.search ||
          tenant.name.toLowerCase().includes(searchDto.search.toLowerCase()) ||
          tenant.email.toLowerCase().includes(searchDto.search.toLowerCase()),
      )
      .map((tenant) => this.mapToResponseDto(tenant));

    return new PaginatedResponseDto(
      responseData,
      searchDto.page || 1,
      searchDto.limit || 10,
      responseData.length,
      'Search completed successfully',
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant retrieved successfully',
    type: ApiResponseDto<TenantResponseDto>,
  })
  async getTenantById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<TenantResponseDto>> {
    const query = new GetTenantByIdQuery(id);
    const tenant: Tenant = await this.queryBus.execute(query);

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const response = this.mapToResponseDto(tenant);
    return new ApiResponseDto(response, 'Tenant retrieved successfully');
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: ApiResponseDto<TenantResponseDto>,
  })
  async updateTenant(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<ApiResponseDto<TenantResponseDto>> {
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
    const response = this.mapToResponseDto(tenant);

    return new ApiResponseDto(response, 'Tenant updated successfully');
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiOperation({ summary: 'Delete tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant deleted successfully',
    type: ApiResponseDto<boolean>,
  })
  async deleteTenant(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<boolean>> {
    const command = new DeleteTenantCommand(id);
    await this.commandBus.execute(command);

    return new ApiResponseDto(true, 'Tenant deleted successfully');
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
