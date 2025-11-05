import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDateString,
  Min,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethodDto {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  MIXED = 'MIXED',
}

export enum SaleStatusDto {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum ItemTypeDto {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
}

export class SaleItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ItemTypeDto })
  @IsEnum(ItemTypeDto)
  type: ItemTypeDto;

  @ApiProperty()
  @IsUUID()
  itemId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  total: number;
}

export class CreateSaleDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsUUID()
  staffId: string;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tip?: number;

  @ApiProperty({ enum: PaymentMethodDto })
  @IsEnum(PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  paymentDetails?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSaleDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tip?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessPaymentDto {
  @ApiProperty({ enum: PaymentMethodDto })
  @IsEnum(PaymentMethodDto)
  paymentMethod: PaymentMethodDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  paymentDetails?: Record<string, any>;
}

export class RefundSaleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}

export class CancelSaleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SaleFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: SaleStatusDto })
  @IsOptional()
  @IsEnum(SaleStatusDto)
  status?: SaleStatusDto;

  @ApiPropertyOptional({ enum: PaymentMethodDto })
  @IsOptional()
  @IsEnum(PaymentMethodDto)
  paymentMethod?: PaymentMethodDto;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  maxAmount?: number;
}

export class SalesPaginationDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class SaleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  staffId: string;

  @ApiProperty({ type: [SaleItemDto] })
  items: SaleItemDto[];

  @ApiProperty({ minimum: 0 })
  discount: number;

  @ApiProperty({ minimum: 0 })
  tax: number;

  @ApiProperty({ minimum: 0 })
  tip: number;

  @ApiProperty({ minimum: 0 })
  subtotal: number;

  @ApiProperty({ minimum: 0 })
  total: number;

  @ApiProperty({ enum: PaymentMethodDto })
  paymentMethod: PaymentMethodDto;

  @ApiPropertyOptional()
  paymentDetails?: Record<string, any>;

  @ApiProperty({ enum: SaleStatusDto })
  status: SaleStatusDto;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  refundReason?: string;

  @ApiPropertyOptional({ minimum: 0 })
  refundAmount?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SalesResponseDto {
  @ApiProperty({ type: [SaleDto] })
  sales: SaleDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class DailySalesDto {
  @ApiProperty()
  totalSales: number;

  @ApiProperty({ minimum: 0 })
  totalAmount: number;

  @ApiProperty({ minimum: 0 })
  averageTicket: number;

  @ApiProperty()
  paymentMethodBreakdown: Record<string, number>;
}

export class SalesReportDto {
  @ApiProperty()
  revenue: Array<{ date: string; amount: number; sales: number }>;

  @ApiProperty()
  summary: {
    totalRevenue: number;
    totalSales: number;
    averageTicket: number;
    growth: number;
  };
}

export class TopItemDto {
  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemName: string;

  @ApiProperty()
  totalSales: number;

  @ApiProperty({ minimum: 0 })
  totalRevenue: number;

  @ApiProperty()
  quantity: number;
}

export class StaffPerformanceDto {
  @ApiProperty()
  staffId: string;

  @ApiProperty()
  staffName: string;

  @ApiProperty()
  totalSales: number;

  @ApiProperty({ minimum: 0 })
  totalRevenue: number;

  @ApiProperty({ minimum: 0 })
  averageTicket: number;

  @ApiProperty({ minimum: 0 })
  commissionsEarned: number;
}

export class SalesReportQueryDto {
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: ['day', 'week', 'month'] })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}
