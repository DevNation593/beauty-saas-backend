import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

// Enums
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// Interface para el input del método fromDomain
interface UserDomainData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  timezone: string;
  locale: string;
  permissions: string[];
  isFirstLogin: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TenantDomainData {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  timezone: string;
  currency: string;
  locale: string;
  status: TenantStatus;
  plan: Record<string, unknown>;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
}

// Authentication DTOs
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  tenantName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

// Tenant DTOs
export class CreateTenantWithOwnerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  slug: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @MinLength(6)
  ownerPassword: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  ownerFirstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  ownerLastName: string;
}

// Response DTOs
export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  timezone: string;
  locale: string;
  permissions: string[];
  isFirstLogin: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;

  static fromDomain(user: UserDomainData): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phone = user.phone;
    dto.avatar = user.avatar;
    dto.role = user.role;
    dto.status = user.status;
    dto.timezone = user.timezone;
    dto.locale = user.locale;
    dto.permissions = user.permissions || [];
    dto.isFirstLogin = user.isFirstLogin;
    dto.lastLoginAt = user.lastLoginAt?.toISOString();
    dto.createdAt = user.createdAt.toISOString();
    dto.updatedAt = user.updatedAt.toISOString();
    return dto;
  }
}

export class TenantResponseDto {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  timezone: string;
  currency: string;
  locale: string;
  status: TenantStatus;
  plan: {
    id: string;
    name: string;
    features: string[];
    modules: string[];
  };
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;

  static fromDomain(tenant: TenantDomainData): TenantResponseDto {
    const dto = new TenantResponseDto();
    dto.id = tenant.id;
    dto.name = tenant.name;
    dto.slug = tenant.slug;
    dto.domain = tenant.domain;
    dto.timezone = tenant.timezone;
    dto.currency = tenant.currency;
    dto.locale = tenant.locale;
    dto.status = tenant.status;
    dto.plan = tenant.plan as any;
    dto.settings = tenant.settings;
    dto.createdAt = tenant.createdAt.toISOString();
    dto.updatedAt = tenant.updatedAt.toISOString();
    return dto;
  }
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
  tenant?: TenantResponseDto;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
