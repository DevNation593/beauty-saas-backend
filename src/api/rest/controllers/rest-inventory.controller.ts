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

// Define basic DTOs for inventory
interface CreateProductDto {
  name: string;
  description?: string;
  sku: string;
  category: string;
  brand?: string;
  price: number;
  cost?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  tags?: string[];
  isActive?: boolean;
}

interface UpdateProductDto {
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  price?: number;
  cost?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  tags?: string[];
  isActive?: boolean;
}

interface ProductResponseDto {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  brand?: string;
  price: number;
  cost?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateStockDto {
  productId: string;
  locationId?: string;
  quantity: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderPoint?: number;
  notes?: string;
}

interface UpdateStockDto {
  quantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderPoint?: number;
  notes?: string;
}

interface StockResponseDto {
  id: string;
  productId: string;
  locationId?: string;
  quantity: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderPoint?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StockMovementDto {
  productId: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  referenceId?: string;
  notes?: string;
}

interface StockMovementResponseDto {
  id: string;
  productId: string;
  movementType: string;
  quantity: number;
  reason: string;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
}

@RestController('Inventory Management')
@Controller('v1/inventory')
@UseGuards(SupabaseAuthGuard, TenantGuard)
@RequireTenant()
export class RestInventoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Product Management Endpoints
  @Post('products')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ApiResponseDto<{ productId: string }>,
  })
  @ApiBearerAuth()
  createProduct(
    @Body(ValidationPipe) _dto: CreateProductDto,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<{ productId: string }> {
    // For now, return mock response - to be implemented with actual commands
    const productId = `prod_${Date.now()}`;

    return new ApiResponseDto({ productId }, 'Product created successfully');
  }

  @Get('products')
  @ApiPaginated()
  @ApiOperation({ summary: 'Get products with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: PaginatedResponseDto<ProductResponseDto>,
  })
  @ApiBearerAuth()
  getProducts(
    @CurrentTenant('id') _tenantId: string,
    @Query() pagination?: PaginationDto,
    @Query('category') _category?: string,
    @Query('brand') _brand?: string,
    @Query('isActive') _isActive?: boolean,
    @Query('search') _search?: string,
  ): PaginatedResponseDto<ProductResponseDto> {
    // Mock response - to be implemented with actual queries
    const mockProducts: ProductResponseDto[] = [
      {
        id: 'prod_1',
        name: 'Shampoo Premium',
        description: 'Professional grade shampoo',
        sku: 'SHAM-001',
        category: 'Hair Care',
        brand: 'Beauty Pro',
        price: 25.99,
        cost: 12.5,
        weight: 500,
        dimensions: { length: 10, width: 5, height: 20 },
        images: [],
        tags: ['hair', 'shampoo', 'professional'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return new PaginatedResponseDto(
      mockProducts,
      pagination?.page || 1,
      pagination?.limit || 20,
      1,
      'Products retrieved successfully',
    );
  }

  @Get('products/:id')
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ApiResponseDto<ProductResponseDto>,
  })
  @ApiBearerAuth()
  getProduct(
    @Param('id') id: string,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<ProductResponseDto> {
    // Mock response - to be implemented with actual queries
    const mockProduct: ProductResponseDto = {
      id,
      name: 'Shampoo Premium',
      description: 'Professional grade shampoo',
      sku: 'SHAM-001',
      category: 'Hair Care',
      brand: 'Beauty Pro',
      price: 25.99,
      cost: 12.5,
      weight: 500,
      dimensions: { length: 10, width: 5, height: 20 },
      images: [],
      tags: ['hair', 'shampoo', 'professional'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new ApiResponseDto(mockProduct, 'Product retrieved successfully');
  }

  @Put('products/:id')
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Update product information' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  updateProduct(
    @Param('id') _id: string,
    @Body(ValidationPipe) _dto: UpdateProductDto,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<boolean> {
    // Mock response - to be implemented with actual commands
    return new ApiResponseDto(true, 'Product updated successfully');
  }

  @Delete('products/:id')
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  deleteProduct(
    @Param('id') _id: string,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<boolean> {
    // Mock response - to be implemented with actual commands
    return new ApiResponseDto(true, 'Product deleted successfully');
  }

  // Stock Management Endpoints
  @Post('stock')
  @ApiOperation({ summary: 'Create stock entry for product' })
  @ApiResponse({
    status: 201,
    description: 'Stock entry created successfully',
    type: ApiResponseDto<{ stockId: string }>,
  })
  @ApiBearerAuth()
  createStock(
    @Body(ValidationPipe) _dto: CreateStockDto,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<{ stockId: string }> {
    // Mock response - to be implemented with actual commands
    const stockId = `stock_${Date.now()}`;

    return new ApiResponseDto({ stockId }, 'Stock entry created successfully');
  }

  @Get('stock')
  @ApiPaginated()
  @ApiOperation({ summary: 'Get stock entries with filters' })
  @ApiResponse({
    status: 200,
    description: 'Stock entries retrieved successfully',
    type: PaginatedResponseDto<StockResponseDto>,
  })
  @ApiBearerAuth()
  getStock(
    @CurrentTenant('id') _tenantId: string,
    @Query() pagination?: PaginationDto,
    @Query('productId') _productId?: string,
    @Query('locationId') _locationId?: string,
    @Query('lowStock') _lowStock?: boolean,
  ): PaginatedResponseDto<StockResponseDto> {
    // Mock response - to be implemented with actual queries
    const mockStock: StockResponseDto[] = [
      {
        id: 'stock_1',
        productId: 'prod_1',
        locationId: 'loc_1',
        quantity: 50,
        minimumStock: 10,
        maximumStock: 100,
        reorderPoint: 15,
        notes: 'Main warehouse stock',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return new PaginatedResponseDto(
      mockStock,
      pagination?.page || 1,
      pagination?.limit || 20,
      1,
      'Stock entries retrieved successfully',
    );
  }

  @Get('stock/:id')
  @ApiParam({ name: 'id', description: 'Stock ID' })
  @ApiOperation({ summary: 'Get stock entry by ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock entry retrieved successfully',
    type: ApiResponseDto<StockResponseDto>,
  })
  @ApiBearerAuth()
  getStockById(
    @Param('id') id: string,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<StockResponseDto> {
    // Mock response - to be implemented with actual queries
    const mockStock: StockResponseDto = {
      id,
      productId: 'prod_1',
      locationId: 'loc_1',
      quantity: 50,
      minimumStock: 10,
      maximumStock: 100,
      reorderPoint: 15,
      notes: 'Main warehouse stock',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new ApiResponseDto(mockStock, 'Stock entry retrieved successfully');
  }

  @Put('stock/:id')
  @ApiParam({ name: 'id', description: 'Stock ID' })
  @ApiOperation({ summary: 'Update stock entry' })
  @ApiResponse({
    status: 200,
    description: 'Stock entry updated successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  updateStock(
    @Param('id') _id: string,
    @Body(ValidationPipe) _dto: UpdateStockDto,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<boolean> {
    // Mock response - to be implemented with actual commands
    return new ApiResponseDto(true, 'Stock entry updated successfully');
  }

  @Delete('stock/:id')
  @ApiParam({ name: 'id', description: 'Stock ID' })
  @ApiOperation({ summary: 'Delete stock entry' })
  @ApiResponse({
    status: 200,
    description: 'Stock entry deleted successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  deleteStock(
    @Param('id') _id: string,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<boolean> {
    // Mock response - to be implemented with actual commands
    return new ApiResponseDto(true, 'Stock entry deleted successfully');
  }

  // Stock Movement Endpoints
  @Post('stock/movements')
  @ApiOperation({ summary: 'Record stock movement' })
  @ApiResponse({
    status: 201,
    description: 'Stock movement recorded successfully',
    type: ApiResponseDto<{ movementId: string }>,
  })
  @ApiBearerAuth()
  recordStockMovement(
    @Body(ValidationPipe) _dto: StockMovementDto,
    @CurrentTenant('id') _tenantId: string,
  ): ApiResponseDto<{ movementId: string }> {
    // Mock response - to be implemented with actual commands
    const movementId = `mov_${Date.now()}`;

    return new ApiResponseDto(
      { movementId },
      'Stock movement recorded successfully',
    );
  }

  @Get('stock/movements')
  @ApiPaginated()
  @ApiOperation({ summary: 'Get stock movements history' })
  @ApiResponse({
    status: 200,
    description: 'Stock movements retrieved successfully',
    type: PaginatedResponseDto<StockMovementResponseDto>,
  })
  @ApiBearerAuth()
  getStockMovements(
    @CurrentTenant('id') _tenantId: string,
    @Query() pagination?: PaginationDto,
    @Query('productId') _productId?: string,
    @Query('movementType') _movementType?: string,
    @Query('dateFrom') _dateFrom?: string,
    @Query('dateTo') _dateTo?: string,
  ): PaginatedResponseDto<StockMovementResponseDto> {
    // Mock response - to be implemented with actual queries
    const mockMovements: StockMovementResponseDto[] = [
      {
        id: 'mov_1',
        productId: 'prod_1',
        movementType: 'IN',
        quantity: 20,
        reason: 'Purchase order received',
        referenceId: 'PO-001',
        notes: 'New stock delivery',
        createdAt: new Date(),
      },
    ];

    return new PaginatedResponseDto(
      mockMovements,
      pagination?.page || 1,
      pagination?.limit || 20,
      1,
      'Stock movements retrieved successfully',
    );
  }

  @Get('stock/low-stock-alerts')
  @ApiOperation({ summary: 'Get products with low stock levels' })
  @ApiResponse({
    status: 200,
    description: 'Low stock alerts retrieved successfully',
    type: ApiResponseDto<StockResponseDto[]>,
  })
  @ApiBearerAuth()
  getLowStockAlerts(
    @CurrentTenant('id') _tenantId: string,
    @Query() pagination?: PaginationDto,
  ): PaginatedResponseDto<ProductResponseDto> {
    const mockLowStock: ProductResponseDto[] = [
      {
        id: 'prod_2',
        name: 'Shampoo LowStock',
        description: 'Low stock sample product',
        sku: 'SHAM-002',
        category: 'Hair Care',
        brand: 'Beauty Pro',
        price: 19.99,
        cost: 9.0,
        weight: 400,
        dimensions: { length: 10, width: 5, height: 18 },
        images: [],
        tags: ['hair'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return new PaginatedResponseDto(
      mockLowStock,
      pagination?.page || 1,
      pagination?.limit || 20,
      mockLowStock.length,
      'Low stock alerts retrieved successfully',
    );
  }
}
