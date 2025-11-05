/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TenantGuard } from '../../../common/auth/tenancy/tenant.guard';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import {
  CurrentTenant,
  RequireTenant,
} from '../../../common/auth/tenancy/tenant.decorator';
import {
  RestController,
  ApiPaginated,
} from '../decorators/api-version.decorator';
import {
  ApiResponseDto,
  PaginatedResponseDto,
  PaginationDto,
} from '../dto/common.dto';

// Import existing DTOs from CRM module
import {
  CreateClientDto,
  UpdateClientDto,
  ClientResponseDto,
  ClientFiltersDto,
} from '../../../modules/crm/interface/dto/client.dto';

// Import commands from CRM module
import {
  CreateClientCommand,
  UpdateClientCommand,
  DeleteClientCommand,
} from '../../../modules/crm/application/commands/ClientCommandHandlers';

// Import queries from CRM module
import {
  GetClientQuery,
  GetClientsQuery,
} from '../../../modules/crm/application/queries/ClientQueryHandlers';

@RestController('Customer Relationship Management')
@Controller('v1/crm')
@UseGuards(SupabaseAuthGuard, TenantGuard)
@RequireTenant()
export class RestCrmController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Client Management Endpoints
  @Post('clients')
  @ApiOperation({ summary: 'Create new client' })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
    type: ApiResponseDto<{ clientId: string }>,
  })
  @ApiBearerAuth()
  async createClient(
    @Body(ValidationPipe) dto: CreateClientDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<{ clientId: string }>> {
    const clientId = await this.commandBus.execute(
      new CreateClientCommand(
        tenantId,
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.phone,
        dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        dto.address,
        dto.city,
        dto.state,
        dto.zipCode,
        dto.country,
        dto.notes,
        dto.tags || [],
        dto.preferences || {},
        dto.marketingConsent || false,
        dto.referredBy,
      ),
    );

    return new ApiResponseDto(
      { clientId: clientId as string },
      'Client created successfully',
    );
  }

  @Get('clients')
  @ApiPaginated()
  @ApiOperation({ summary: 'Get clients with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Clients retrieved successfully',
    type: PaginatedResponseDto<ClientResponseDto>,
  })
  @ApiBearerAuth()
  async getClients(
    @Query(ValidationPipe) query: ClientFiltersDto,
    @Query() pagination: PaginationDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<PaginatedResponseDto<ClientResponseDto>> {
    const clients = await this.queryBus.execute(
      new GetClientsQuery(
        tenantId,
        {
          search: query.search,
          status: query.status,
          segment: query.segment,
          hasEmail: query.hasEmail,
          hasPhone: query.hasPhone,
          tags: query.tags,
          lastVisitFrom: query.lastVisitFrom
            ? new Date(query.lastVisitFrom)
            : undefined,
          lastVisitTo: query.lastVisitTo
            ? new Date(query.lastVisitTo)
            : undefined,
        },
        undefined,
        { page: pagination.page || 1, limit: pagination.limit || 20 },
      ),
    );

    // Transform domain objects to DTOs
    const clientsArray = Array.isArray(clients) ? (clients as unknown[]) : [];
    const responseData = clientsArray.map((client: unknown) =>
      this.mapClientToDto(client),
    );

    return new PaginatedResponseDto(
      responseData,
      pagination.page || 1,
      pagination.limit || 20,
      (clients as unknown[]).length,
      'Clients retrieved successfully',
    );
  }

  @Get('clients/:id')
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({
    status: 200,
    description: 'Client retrieved successfully',
    type: ApiResponseDto<ClientResponseDto>,
  })
  @ApiBearerAuth()
  async getClient(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<ClientResponseDto>> {
    const client = await this.queryBus.execute(
      new GetClientQuery(id, tenantId),
    );

    if (!client) {
      throw new Error('Client not found');
    }

    const response = this.mapClientToDto(client);
    return new ApiResponseDto(response, 'Client retrieved successfully');
  }

  @Put('clients/:id')
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiOperation({ summary: 'Update client information' })
  @ApiResponse({
    status: 200,
    description: 'Client updated successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  async updateClient(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateClientDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(
      new UpdateClientCommand(
        id,
        tenantId,
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.phone,
        dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        dto.address,
        dto.city,
        dto.state,
        dto.zipCode,
        dto.country,
        dto.notes,
        dto.tags,
        dto.preferences,
        dto.marketingConsent,
      ),
    );

    return new ApiResponseDto(true, 'Client updated successfully');
  }

  @Delete('clients/:id')
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiOperation({ summary: 'Delete client' })
  @ApiResponse({
    status: 200,
    description: 'Client deleted successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  async deleteClient(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(new DeleteClientCommand(id, tenantId));
    return new ApiResponseDto(true, 'Client deleted successfully');
  }

  // Notes Management Endpoints (Mock implementation)
  @Post('notes')
  @ApiOperation({ summary: 'Create new note (Mock)' })
  @ApiResponse({
    status: 201,
    description: 'Note created successfully',
    type: ApiResponseDto<{ noteId: string }>,
  })
  @ApiBearerAuth()
  async createNote(
    @Body() _dto: unknown,
    @CurrentTenant('id') _tenantId: string,
  ): Promise<ApiResponseDto<{ noteId: string }>> {
    const noteId = `note_${Date.now()}`;
    return new ApiResponseDto({ noteId }, 'Note created successfully');
  }

  @Get('notes')
  @ApiPaginated()
  @ApiOperation({ summary: 'Get notes (Mock)' })
  @ApiResponse({
    status: 200,
    description: 'Notes retrieved successfully',
    type: PaginatedResponseDto<unknown>,
  })
  @ApiBearerAuth()
  async getNotes(
    @Query() pagination: PaginationDto,
    @CurrentTenant('id') _tenantId: string,
  ): Promise<PaginatedResponseDto<unknown>> {
    const mockNotes: unknown[] = [];

    return new PaginatedResponseDto(
      mockNotes,
      pagination.page || 1,
      pagination.limit || 20,
      0,
      'Notes retrieved successfully',
    );
  }

  private mapClientToDto(client: unknown): ClientResponseDto {
    const c = client && typeof client === 'object' ? (client as any) : {};

    const firstName = c.firstName ?? '';
    const lastName = c.lastName ?? '';

    return {
      id: c.id,
      tenantId: c.tenantId,
      firstName,
      lastName,
      email: c.email,
      phone: c.phone,
      dateOfBirth: c.dateOfBirth,
      address: c.address,
      city: c.city,
      state: c.state,
      zipCode: c.zipCode,
      country: c.country,
      status: c.status,
      segment: c.segment,
      notes: c.notes,
      tags: c.tags || [],
      preferences: c.preferences || {},
      marketingConsent: c.marketingConsent,
      referredBy: c.referredBy,
      lastVisit: c.lastVisit,
      totalSpent: c.totalSpent || 0,
      visitCount: c.visitCount || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      fullName: `${firstName} ${lastName}`.trim(),
      age: c.dateOfBirth
        ? Math.floor(
            (Date.now() - new Date(c.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : undefined,
      daysSinceLastVisit: c.lastVisit
        ? Math.floor(
            (Date.now() - new Date(c.lastVisit).getTime()) /
              (24 * 60 * 60 * 1000),
          )
        : undefined,
    } as ClientResponseDto;
  }
}
