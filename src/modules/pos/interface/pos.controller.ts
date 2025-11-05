import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  // ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import { TenantGuard } from '../../../common/auth/tenancy/tenant.guard';
import { RoleGuard } from '../../../common/auth/rbac/role.guard';
import { Roles } from '../../../common/auth/rbac/roles.decorator';
import { Tenant } from '../../../common/auth/tenancy/tenant.decorator';
import {
  CreateSaleDto,
  UpdateSaleDto,
  ProcessPaymentDto,
  RefundSaleDto,
  CancelSaleDto,
  SaleFilterDto,
  SalesPaginationDto,
  SaleDto,
  SalesResponseDto,
  DailySalesDto,
  SalesReportDto,
  TopItemDto,
  StaffPerformanceDto,
  SalesReportQueryDto,
} from './dto/sale.dto';
import {
  CreateSaleCommand,
  UpdateSaleCommand,
  ProcessPaymentCommand,
  RefundSaleCommand,
  CancelSaleCommand,
} from '../application/commands/SaleCommandHandlers';
import {
  GetSaleByIdQuery,
  GetSalesQuery,
  GetDailySalesQuery,
  GetSalesReportQuery,
  GetTopServicesQuery,
  GetTopProductsQuery,
  GetStaffPerformanceQuery,
} from '../application/queries/SaleQueryHandlers';
import { PaymentMethod } from '../domain/Sale';
import { PaymentMethodDto } from './dto/sale.dto';

// @ApiTags('POS - Sales')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantGuard, RoleGuard)
@Controller('pos/sales')
export class PosController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  private convertPaymentMethodDtoToDomain(
    dto: PaymentMethodDto,
  ): PaymentMethod {
    switch (dto) {
      case PaymentMethodDto.CASH:
        return PaymentMethod.CASH;
      case PaymentMethodDto.CARD:
        return PaymentMethod.CARD;
      case PaymentMethodDto.TRANSFER:
        return PaymentMethod.TRANSFER;
      case PaymentMethodDto.MIXED:
        return PaymentMethod.DIGITAL_WALLET; // Best mapping for mixed
      default:
        return PaymentMethod.CASH;
    }
  }

  @Post()
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sale created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  async createSale(
    @Tenant() tenantId: string,
    @Body() createSaleDto: CreateSaleDto,
  ): Promise<{ id: string }> {
    const command = new CreateSaleCommand(
      tenantId,
      createSaleDto.clientId,
      createSaleDto.staffId,
      createSaleDto.items.map((item) => ({
        type: item.type,
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
      createSaleDto.discount || 0,
      createSaleDto.tax || 0,
      createSaleDto.tip || 0,
      this.convertPaymentMethodDtoToDomain(createSaleDto.paymentMethod),
      createSaleDto.paymentDetails,
      createSaleDto.notes,
    );

    const saleId = await this.commandBus.execute(command);
    return { id: saleId };
  }

  @Get()
  @Roles('admin', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get sales with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales retrieved successfully',
    type: SalesResponseDto,
  })
  async getSales(
    @Tenant() tenantId: string,
    @Query() filters: SaleFilterDto,
    @Query() pagination: SalesPaginationDto,
  ): Promise<SalesResponseDto> {
    const query = new GetSalesQuery(
      tenantId,
      pagination.page || 1,
      pagination.limit || 20,
      {
        clientId: filters.clientId,
        staffId: filters.staffId,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        status: filters.status,
        paymentMethod: filters.paymentMethod,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
      },
      pagination.sortBy,
      pagination.sortOrder,
    );

    return this.queryBus.execute(query);
  }

  @Get('daily')
  @Roles('admin', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get daily sales summary' })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily sales retrieved successfully',
    type: DailySalesDto,
  })
  async getDailySales(
    @Tenant() tenantId: string,
    @Query('date') date?: string,
  ): Promise<DailySalesDto> {
    const query = new GetDailySalesQuery(
      tenantId,
      date ? new Date(date) : new Date(),
    );

    return this.queryBus.execute(query);
  }

  @Get('reports')
  @Roles('admin', 'manager', 'viewer')
  @ApiOperation({ summary: 'Generate sales report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales report generated successfully',
    type: SalesReportDto,
  })
  async getSalesReport(
    @Tenant() tenantId: string,
    @Query() reportQuery: SalesReportQueryDto,
  ): Promise<SalesReportDto> {
    const query = new GetSalesReportQuery(
      tenantId,
      new Date(reportQuery.startDate),
      new Date(reportQuery.endDate),
      reportQuery.groupBy,
    );

    return this.queryBus.execute(query);
  }

  @Get('top-services')
  @Roles('admin', 'manager', 'viewer')
  @ApiOperation({ summary: 'Get top selling services' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top services retrieved successfully',
    type: [TopItemDto],
  })
  async getTopServices(
    @Tenant() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ): Promise<TopItemDto[]> {
    const query = new GetTopServicesQuery(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      limit || 10,
    );

    return this.queryBus.execute(query);
  }

  @Get('top-products')
  @Roles('admin', 'manager', 'viewer')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top products retrieved successfully',
    type: [TopItemDto],
  })
  async getTopProducts(
    @Tenant() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ): Promise<TopItemDto[]> {
    const query = new GetTopProductsQuery(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      limit || 10,
    );

    return this.queryBus.execute(query);
  }

  @Get('staff-performance')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get staff performance metrics' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'staffId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff performance retrieved successfully',
    type: [StaffPerformanceDto],
  })
  async getStaffPerformance(
    @Tenant() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('staffId') staffId?: string,
  ): Promise<StaffPerformanceDto[]> {
    const query = new GetStaffPerformanceQuery(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      staffId,
    );

    return this.queryBus.execute(query);
  }

  @Get(':id')
  @Roles('admin', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sale retrieved successfully',
    type: SaleDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sale not found',
  })
  async getSaleById(
    @Tenant() tenantId: string,
    @Param('id') saleId: string,
  ): Promise<SaleDto> {
    const query = new GetSaleByIdQuery(saleId, tenantId);
    const sale = await this.queryBus.execute(query);

    if (!sale) {
      throw new Error('Sale not found');
    }

    return sale;
  }

  @Put(':id')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Update sale details' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sale updated successfully',
  })
  async updateSale(
    @Tenant() tenantId: string,
    @Param('id') saleId: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ): Promise<void> {
    const command = new UpdateSaleCommand(
      saleId,
      tenantId,
      updateSaleDto.discount,
      updateSaleDto.tax,
      updateSaleDto.tip,
      updateSaleDto.notes,
    );

    await this.commandBus.execute(command);
  }

  @Post(':id/payment')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Process payment for sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment processed successfully',
  })
  async processPayment(
    @Tenant() tenantId: string,
    @Param('id') saleId: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ): Promise<void> {
    const command = new ProcessPaymentCommand(
      saleId,
      tenantId,
      this.convertPaymentMethodDtoToDomain(processPaymentDto.paymentMethod),
      processPaymentDto.paymentDetails,
    );

    await this.commandBus.execute(command);
  }

  @Post(':id/refund')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Refund sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sale refunded successfully',
  })
  async refundSale(
    @Tenant() tenantId: string,
    @Param('id') saleId: string,
    @Body() refundSaleDto: RefundSaleDto,
  ): Promise<void> {
    const command = new RefundSaleCommand(
      saleId,
      tenantId,
      refundSaleDto.reason,
      refundSaleDto.refundAmount,
    );

    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Cancel sale' })
  @ApiParam({ name: 'id', description: 'Sale ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sale cancelled successfully',
  })
  async cancelSale(
    @Tenant() tenantId: string,
    @Param('id') saleId: string,
    @Body() cancelSaleDto: CancelSaleDto,
  ): Promise<void> {
    const command = new CancelSaleCommand(
      saleId,
      tenantId,
      cancelSaleDto.reason,
    );

    await this.commandBus.execute(command);
  }
}
