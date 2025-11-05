import {
  Controller,
  Post,
  Get,
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
import { TenantGuard } from '../../../common/auth/tenancy/tenant.guard';
import { CurrentTenant } from '../../../common/auth/tenancy/tenant.decorator';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFiltersDto,
  ClientSortDto,
  ClientPaginationDto,
  AddClientTagDto,
  RemoveClientTagDto,
  ClientResponseDto,
  ClientListResponseDto,
  ClientAnalyticsResponseDto,
} from './dto/client.dto';
import {
  CreateClientCommand,
  UpdateClientCommand,
  DeleteClientCommand,
  AddClientTagCommand,
  RemoveClientTagCommand,
} from '../application/commands/ClientCommandHandlers';
import {
  GetClientQuery,
  GetClientsQuery,
  GetClientByEmailQuery,
  GetClientByPhoneQuery,
  GetClientsBySegmentQuery,
  GetClientsByStatusQuery,
  GetClientAnalyticsQuery,
  GetClientRetentionReportQuery,
  ExportClientsQuery,
} from '../application/queries/ClientQueryHandlers';
import { Client, ClientSegment, ClientStatus } from '../domain/Client';

// @ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(TenantGuard)
export class ClientController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  async createClient(
    @CurrentTenant() tenantId: string,
    @Body() createClientDto: CreateClientDto,
  ): Promise<{ id: string }> {
    const command = new CreateClientCommand(
      tenantId,
      createClientDto.firstName,
      createClientDto.lastName,
      createClientDto.email,
      createClientDto.phone,
      createClientDto.dateOfBirth
        ? new Date(createClientDto.dateOfBirth)
        : undefined,
      createClientDto.address,
      createClientDto.city,
      createClientDto.state,
      createClientDto.zipCode,
      createClientDto.country,
      createClientDto.notes,
      createClientDto.tags || [],
      createClientDto.preferences || {},
      createClientDto.marketingConsent || false,
      createClientDto.referredBy,
    );

    const clientId: string = await this.commandBus.execute(command);
    return { id: clientId };
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients with filtering and pagination' })
  @ApiResponse({ status: 200, type: ClientListResponseDto })
  async getClients(
    @CurrentTenant() tenantId: string,
    @Query() filters: ClientFiltersDto,
    @Query() sort: ClientSortDto,
    @Query() pagination: ClientPaginationDto,
  ): Promise<ClientListResponseDto> {
    const query = new GetClientsQuery(
      tenantId,
      {
        search: filters.search,
        status: filters.status,
        segment: filters.segment,
        hasEmail: filters.hasEmail,
        hasPhone: filters.hasPhone,
        tags: filters.tags,
        lastVisitFrom: filters.lastVisitFrom
          ? new Date(filters.lastVisitFrom)
          : undefined,
        lastVisitTo: filters.lastVisitTo
          ? new Date(filters.lastVisitTo)
          : undefined,
      },
      {
        field: sort.field || 'createdAt',
        direction: sort.order || 'desc',
        order: sort.order || 'desc', // Para compatibilidad
      },
      {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
      },
    );

    const result: {
      clients: Client[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    } = await this.queryBus.execute(query);
    return {
      clients: result.clients.map((client) => this.mapToResponseDto(client)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClient(
    @CurrentTenant() tenantId: string,
    @Param('id') clientId: string,
  ): Promise<ClientResponseDto> {
    const query = new GetClientQuery(clientId, tenantId);
    const client: Client | null = await this.queryBus.execute(query);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.mapToResponseDto(client);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async updateClient(
    @CurrentTenant() tenantId: string,
    @Param('id') clientId: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<void> {
    const command = new UpdateClientCommand(
      clientId,
      tenantId,
      updateClientDto.firstName,
      updateClientDto.lastName,
      updateClientDto.email,
      updateClientDto.phone,
      updateClientDto.dateOfBirth
        ? new Date(updateClientDto.dateOfBirth)
        : undefined,
      updateClientDto.address,
      updateClientDto.city,
      updateClientDto.state,
      updateClientDto.zipCode,
      updateClientDto.country,
      updateClientDto.notes,
      updateClientDto.tags,
      updateClientDto.preferences,
      updateClientDto.marketingConsent,
    );

    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async deleteClient(
    @CurrentTenant() tenantId: string,
    @Param('id') clientId: string,
  ): Promise<void> {
    const command = new DeleteClientCommand(clientId, tenantId);
    await this.commandBus.execute(command);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add a tag to a client' })
  @ApiResponse({ status: 200, description: 'Tag added successfully' })
  async addClientTag(
    @CurrentTenant() tenantId: string,
    @Param('id') clientId: string,
    @Body() addTagDto: AddClientTagDto,
  ): Promise<void> {
    const command = new AddClientTagCommand(clientId, tenantId, addTagDto.tag);
    await this.commandBus.execute(command);
  }

  @Delete(':id/tags')
  @ApiOperation({ summary: 'Remove a tag from a client' })
  @ApiResponse({ status: 200, description: 'Tag removed successfully' })
  async removeClientTag(
    @CurrentTenant() tenantId: string,
    @Param('id') clientId: string,
    @Body() removeTagDto: RemoveClientTagDto,
  ): Promise<void> {
    const command = new RemoveClientTagCommand(
      clientId,
      tenantId,
      removeTagDto.tag,
    );
    await this.commandBus.execute(command);
  }

  @Get('search/email/:email')
  @ApiOperation({ summary: 'Find client by email' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientByEmail(
    @CurrentTenant() tenantId: string,
    @Param('email') email: string,
  ): Promise<ClientResponseDto | null> {
    const query = new GetClientByEmailQuery(email, tenantId);
    const client: Client | null = await this.queryBus.execute(query);

    return client ? this.mapToResponseDto(client) : null;
  }

  @Get('search/phone/:phone')
  @ApiOperation({ summary: 'Find client by phone' })
  @ApiResponse({ status: 200, type: ClientResponseDto })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientByPhone(
    @CurrentTenant() tenantId: string,
    @Param('phone') phone: string,
  ): Promise<ClientResponseDto | null> {
    const query = new GetClientByPhoneQuery(phone, tenantId);
    const client: Client | null = await this.queryBus.execute(query);

    return client ? this.mapToResponseDto(client) : null;
  }

  @Get('segment/:segment')
  @ApiOperation({ summary: 'Get clients by segment' })
  @ApiResponse({ status: 200, type: [ClientResponseDto] })
  async getClientsBySegment(
    @CurrentTenant() tenantId: string,
    @Param('segment') segment: ClientSegment,
  ): Promise<ClientResponseDto[]> {
    const query = new GetClientsBySegmentQuery(segment, tenantId);
    const clients: Client[] = await this.queryBus.execute(query);

    return clients.map((client) => this.mapToResponseDto(client));
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get clients by status' })
  @ApiResponse({ status: 200, type: [ClientResponseDto] })
  async getClientsByStatus(
    @CurrentTenant() tenantId: string,
    @Param('status') status: ClientStatus,
  ): Promise<ClientResponseDto[]> {
    const query = new GetClientsByStatusQuery(status, tenantId);
    const clients: Client[] = await this.queryBus.execute(query);

    return clients.map((client) => this.mapToResponseDto(client));
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get client analytics overview' })
  @ApiResponse({ status: 200, type: ClientAnalyticsResponseDto })
  async getClientAnalytics(
    @CurrentTenant() tenantId: string,
  ): Promise<ClientAnalyticsResponseDto> {
    const query = new GetClientAnalyticsQuery(tenantId);
    const analytics: {
      totalClients: number;
      activeClients: number;
      newClientsThisMonth: number;
      averageLifetimeValue: number;
      segmentDistribution: Record<ClientSegment, number>;
      topSpenders: Array<{ client: Client; totalSpent: number }>;
    } = await this.queryBus.execute(query);

    return {
      ...analytics,
      topSpenders: analytics.topSpenders.map((item) => ({
        client: this.mapToResponseDto(item.client),
        totalSpent: item.totalSpent,
      })),
    };
  }

  @Get('analytics/retention')
  @ApiOperation({ summary: 'Get client retention report' })
  @ApiResponse({ status: 200, type: [Object] })
  async getClientRetentionReport(@CurrentTenant() tenantId: string): Promise<
    Array<{
      month: Date;
      newClients: number;
      returningClients: number;
      retentionRate: number;
    }>
  > {
    const query = new GetClientRetentionReportQuery(tenantId);
    return this.queryBus.execute(query);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export clients to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file generated' })
  async exportClients(
    @CurrentTenant() tenantId: string,
    @Query() filters: ClientFiltersDto,
  ): Promise<Client[]> {
    const query = new ExportClientsQuery(tenantId, {
      search: filters.search,
      status: filters.status,
      segment: filters.segment,
      hasEmail: filters.hasEmail,
      hasPhone: filters.hasPhone,
      tags: filters.tags,
      lastVisitFrom: filters.lastVisitFrom
        ? new Date(filters.lastVisitFrom)
        : undefined,
      lastVisitTo: filters.lastVisitTo
        ? new Date(filters.lastVisitTo)
        : undefined,
    });

    return this.queryBus.execute(query);
  }

  private mapToResponseDto(client: Client): ClientResponseDto {
    const now = new Date();
    const daysSinceLastVisit = client.lastVisit
      ? Math.floor(
          (now.getTime() - client.lastVisit.getTime()) / (1000 * 3600 * 24),
        )
      : undefined;

    const age = client.dateOfBirth
      ? now.getFullYear() - client.dateOfBirth.getFullYear()
      : undefined;

    return {
      id: client.id,
      tenantId: client.tenantId,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      dateOfBirth: client.dateOfBirth,
      address: client.address,
      city: client.city,
      state: client.state,
      zipCode: client.zipCode,
      country: client.country,
      status: client.status,
      segment: client.segment,
      notes: client.notes,
      tags: client.tags,
      preferences: client.preferences,
      marketingConsent: client.marketingConsent,
      referredBy: client.referredBy,
      lastVisit: client.lastVisit,
      totalSpent: client.totalSpent,
      visitCount: client.visitCount,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      fullName: client.fullName,
      age,
      daysSinceLastVisit,
    };
  }
}
