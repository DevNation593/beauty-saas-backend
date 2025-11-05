import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClientStatus, ClientSegment } from '../../domain/Client';

export class CreateClientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @IsOptional()
  @IsString()
  referredBy?: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}

export class ClientFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsEnum(ClientSegment)
  segment?: ClientSegment;

  @IsOptional()
  @IsBoolean()
  hasEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPhone?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  lastVisitFrom?: string;

  @IsOptional()
  @IsDateString()
  lastVisitTo?: string;
}

export class ClientSortDto {
  @IsOptional()
  @IsEnum([
    'firstName',
    'lastName',
    'email',
    'createdAt',
    'lastVisit',
    'totalSpent',
  ])
  field?:
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'createdAt'
    | 'lastVisit'
    | 'totalSpent';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export class ClientPaginationDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class AddClientTagDto {
  @IsString()
  tag: string;
}

export class RemoveClientTagDto {
  @IsString()
  tag: string;
}

export class ClientResponseDto {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  status: ClientStatus;
  segment: ClientSegment;
  notes?: string;
  tags: string[];
  preferences: Record<string, any>;
  marketingConsent: boolean;
  referredBy?: string;
  lastVisit?: Date;
  totalSpent: number;
  visitCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Computed properties
  fullName: string;
  age?: number;
  daysSinceLastVisit?: number;
}

export class ClientListResponseDto {
  clients: ClientResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ClientAnalyticsResponseDto {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  averageLifetimeValue: number;
  segmentDistribution: Record<ClientSegment, number>;
  topSpenders: Array<{
    client: ClientResponseDto;
    totalSpent: number;
  }>;
}

export class ClientRetentionReportDto {
  month: Date;
  newClients: number;
  returningClients: number;
  retentionRate: number;
}
