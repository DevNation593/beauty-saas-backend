import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus } from '../../domain/Tenant';

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Tenant email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Tenant phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Tenant address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Tenant city', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Tenant state', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Tenant country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Timezone', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: 'Locale', default: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({ description: 'Plan ID' })
  @IsString()
  planId: string;

  @ApiProperty({ description: 'Features array', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ description: 'Custom domain', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ description: 'Billing email', required: false })
  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @ApiProperty({ description: 'Tax ID', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class UpdateTenantDto {
  @ApiProperty({ description: 'Tenant name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Tenant email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Tenant phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Tenant address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Tenant city', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Tenant state', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Tenant country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Timezone', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: 'Locale', required: false })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({ description: 'Custom domain', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ description: 'Billing email', required: false })
  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @ApiProperty({ description: 'Tax ID', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class UpdateTenantStatusDto {
  @ApiProperty({ description: 'New status', enum: TenantStatus })
  @IsEnum(TenantStatus)
  status: TenantStatus;

  @ApiProperty({ description: 'Reason for status change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateTenantSubscriptionDto {
  @ApiProperty({ description: 'Plan ID' })
  @IsString()
  planId: string;

  @ApiProperty({ description: 'Subscription end date', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ExtendTenantTrialDto {
  @ApiProperty({ description: 'Number of days to extend trial' })
  @IsNumber()
  days: number;
}

export class TenantFilterDto {
  @ApiProperty({
    description: 'Filter by status',
    enum: TenantStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiProperty({ description: 'Filter by plan ID', required: false })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class BulkUpdateStatusDto {
  @ApiProperty({ description: 'Array of tenant IDs' })
  @IsArray()
  @IsString({ each: true })
  tenantIds: string[];

  @ApiProperty({ description: 'New status', enum: TenantStatus })
  @IsEnum(TenantStatus)
  status: TenantStatus;

  @ApiProperty({ description: 'Reason for status change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Response DTOs
export class TenantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  state?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  locale: string;

  @ApiProperty()
  planId: string;

  @ApiProperty({ enum: TenantStatus })
  status: TenantStatus;

  @ApiProperty({ required: false })
  domain?: string;

  @ApiProperty()
  subscriptionStartDate: Date;

  @ApiProperty({ required: false })
  subscriptionEndDate?: Date;

  @ApiProperty({ required: false })
  trialEndDate?: Date;

  @ApiProperty()
  maxUsers: number;

  @ApiProperty()
  maxClients: number;

  @ApiProperty()
  maxLocations: number;

  @ApiProperty()
  features: string[];

  @ApiProperty({ required: false })
  logoUrl?: string;

  @ApiProperty({ required: false })
  billingEmail?: string;

  @ApiProperty({ required: false })
  taxId?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  settings: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TenantAnalyticsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  byStatus: Record<TenantStatus, number>;

  @ApiProperty()
  byPlan: Record<string, number>;

  @ApiProperty()
  trialExpiring: number;

  @ApiProperty()
  subscriptionExpiring: number;
}
