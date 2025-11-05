import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export enum StockStatusDto {
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  IN_STOCK = 'IN_STOCK',
  OVERSTOCKED = 'OVERSTOCKED',
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsNumber()
  @Min(0)
  minStock: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;
}

export class UpdatePriceDto {
  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}

export class UpdateStockDto {
  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  newStock: number;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class AdjustStockDto {
  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  sku?: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  cost?: number;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  brand?: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  minStock: number;

  @ApiPropertyOptional()
  maxStock?: number;

  @ApiPropertyOptional()
  unit?: string;

  @ApiProperty({ enum: ProductStatusDto })
  status: ProductStatusDto;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isLowStock: boolean;

  @ApiProperty()
  isOutOfStock: boolean;

  @ApiPropertyOptional()
  profitMargin?: number;

  @ApiProperty({ enum: StockStatusDto })
  stockStatus: StockStatusDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProductsResponseDto {
  @ApiProperty({ type: [ProductDto] })
  products: ProductDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class InventoryStatsDto {
  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  activeProducts: number;

  @ApiProperty()
  lowStockCount: number;

  @ApiProperty()
  outOfStockCount: number;

  @ApiProperty()
  totalInventoryValue: number;

  @ApiProperty()
  totalInventoryCost: number;

  @ApiProperty()
  categoriesCount: number;

  @ApiProperty()
  brandsCount: number;
}
