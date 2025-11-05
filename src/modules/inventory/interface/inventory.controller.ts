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
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import { TenantGuard } from '../../../common/auth/tenancy/tenant.guard';
import { RoleGuard } from '../../../common/auth/rbac/role.guard';
import { Roles } from '../../../common/auth/rbac/roles.decorator';
import { Tenant } from '../../../common/auth/tenancy/tenant.decorator';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdatePriceDto,
  UpdateStockDto,
  AdjustStockDto,
  ProductDto,
  ProductsResponseDto,
  InventoryStatsDto,
} from './dto/product.dto';
import { ProductStatus } from '../domain/Product';

type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' | 'OVERSTOCKED';

import {
  CreateProductCommand,
  UpdateProductCommand,
  UpdateProductPriceCommand,
  UpdateProductStockCommand,
  AdjustProductStockCommand,
  ActivateProductCommand,
  DeactivateProductCommand,
  DeleteProductCommand,
} from '../application/commands/ProductCommandHandlers';
import {
  GetProductByIdQuery,
  GetProductsQuery,
  GetLowStockProductsQuery,
  GetOutOfStockProductsQuery,
  GetCategoriesQuery,
  GetBrandsQuery,
  GetInventoryStatsQuery,
} from '../application/queries/ProductQueryHandlers';

// @ApiTags('Inventory - Products')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, TenantGuard, RoleGuard)
@Controller('inventory/products')
export class InventoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
  })
  async createProduct(
    @Tenant() tenantId: string,
    @Body() createProductDto: CreateProductDto,
  ): Promise<{ id: string }> {
    const command = new CreateProductCommand(
      tenantId,
      createProductDto.name,
      createProductDto.description,
      createProductDto.sku,
      createProductDto.barcode,
      createProductDto.price,
      createProductDto.cost,
      createProductDto.category,
      createProductDto.brand,
      createProductDto.minStock,
      createProductDto.maxStock,
      createProductDto.unit,
    );

    const productId = await this.commandBus.execute(command);
    return { id: productId };
  }

  @Get()
  @Roles('admin', 'manager', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get products with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
    type: ProductsResponseDto,
  })
  async getProducts(
    @Tenant() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('status') status?: string,
    @Query('stockStatus') stockStatus?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<ProductsResponseDto> {
    const query = new GetProductsQuery(
      tenantId,
      page,
      limit,
      {
        category,
        brand,
        status: status as ProductStatus,
        stockStatus: stockStatus as StockStatus,
        search,
      },
      sortBy,
      sortOrder,
    );

    return this.queryBus.execute(query);
  }

  @Get('stats')
  @Roles('admin', 'manager', 'viewer')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory stats retrieved successfully',
    type: InventoryStatsDto,
  })
  async getInventoryStats(
    @Tenant() tenantId: string,
  ): Promise<InventoryStatsDto> {
    const query = new GetInventoryStatsQuery(tenantId);
    return this.queryBus.execute(query);
  }

  @Get('low-stock')
  @Roles('admin', 'manager', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get low stock products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Low stock products retrieved successfully',
    type: [ProductDto],
  })
  async getLowStockProducts(@Tenant() tenantId: string): Promise<ProductDto[]> {
    const query = new GetLowStockProductsQuery(tenantId);
    return this.queryBus.execute(query);
  }

  @Get('out-of-stock')
  @Roles('admin', 'manager', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get out of stock products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Out of stock products retrieved successfully',
    type: [ProductDto],
  })
  async getOutOfStockProducts(
    @Tenant() tenantId: string,
  ): Promise<ProductDto[]> {
    const query = new GetOutOfStockProductsQuery(tenantId);
    return this.queryBus.execute(query);
  }

  @Get('categories')
  @Roles('admin', 'manager', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
  })
  async getCategories(@Tenant() tenantId: string): Promise<string[]> {
    const query = new GetCategoriesQuery(tenantId);
    return this.queryBus.execute(query);
  }

  @Get('brands')
  @Roles('admin', 'manager', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get all product brands' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brands retrieved successfully',
  })
  async getBrands(@Tenant() tenantId: string): Promise<string[]> {
    const query = new GetBrandsQuery(tenantId);
    return this.queryBus.execute(query);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'staff', 'viewer')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product retrieved successfully',
    type: ProductDto,
  })
  async getProductById(
    @Tenant() tenantId: string,
    @Param('id') productId: string,
  ): Promise<ProductDto> {
    const query = new GetProductByIdQuery(productId, tenantId);
    const product = await this.queryBus.execute(query);

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  @Put(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update product details' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
  })
  async updateProduct(
    @Tenant() tenantId: string,
    @Param('id') productId: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<void> {
    const command = new UpdateProductCommand(
      productId,
      tenantId,
      updateProductDto.name,
      updateProductDto.description,
      updateProductDto.category,
      updateProductDto.brand,
      updateProductDto.unit,
    );

    await this.commandBus.execute(command);
  }

  @Put(':id/price')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update product price' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product price updated successfully',
  })
  async updateProductPrice(
    @Tenant() tenantId: string,
    @Param('id') productId: string,
    @Body() updatePriceDto: UpdatePriceDto,
  ): Promise<void> {
    const command = new UpdateProductPriceCommand(
      productId,
      tenantId,
      updatePriceDto.price,
      updatePriceDto.cost,
    );

    await this.commandBus.execute(command);
  }

  @Put(':id/stock')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Update product stock' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product stock updated successfully',
  })
  async updateStock(
    @Tenant() tenantId: string,
    @Param('id') productId: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<void> {
    const command = new UpdateProductStockCommand(
      productId,
      tenantId,
      updateStockDto.newStock,
      updateStockDto.reason,
    );

    await this.commandBus.execute(command);
  }

  @Post(':id/adjust-stock')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Adjust product stock' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product stock adjusted successfully',
  })
  async adjustStock(
    @Tenant() tenantId: string,
    @Param('id') productId: string,
    @Body() adjustStockDto: AdjustStockDto,
  ): Promise<void> {
    const command = new AdjustProductStockCommand(
      productId,
      tenantId,
      adjustStockDto.quantity,
      adjustStockDto.reason,
    );

    await this.commandBus.execute(command);
  }

  @Post(':id/activate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Activate product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product activated successfully',
  })
  async activateProduct(
    @Tenant() tenantId: string,
    @Param('id') productId: string,
  ): Promise<void> {
    const command = new ActivateProductCommand(productId, tenantId);
    await this.commandBus.execute(command);
  }

  @Post(':id/deactivate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product deactivated successfully',
  })
  async deactivateProduct(
    @Tenant() tenantId: string,
    @Param('id') productId: string,
  ): Promise<void> {
    const command = new DeactivateProductCommand(productId, tenantId);
    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product deleted successfully',
  })
  async deleteProduct(
    @Tenant() tenantId: string,
    @Param('id') productId: string,
  ): Promise<void> {
    const command = new DeleteProductCommand(productId, tenantId);
    await this.commandBus.execute(command);
  }
}
