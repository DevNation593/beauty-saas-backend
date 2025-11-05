import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRoleDto {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF',
  CLIENT = 'CLIENT',
}

export enum UserStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ enum: UserRoleDto })
  @IsEnum(UserRoleDto)
  role: UserRoleDto;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'password123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locale?: string;
}

export class ChangeRoleDto {
  @ApiProperty({ enum: UserRoleDto })
  @IsEnum(UserRoleDto)
  role: UserRoleDto;
}

export class ChangePasswordDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPassword?: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class UpdatePreferencesDto {
  @ApiProperty()
  @IsObject()
  preferences: Record<string, any>;
}

export class UserFilterDto {
  @ApiPropertyOptional({ enum: UserRoleDto })
  @IsOptional()
  @IsEnum(UserRoleDto)
  role?: UserRoleDto;

  @ApiPropertyOptional({ enum: UserStatusDto })
  @IsOptional()
  @IsEnum(UserStatusDto)
  status?: UserStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class UserPaginationDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
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

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty({ enum: UserRoleDto })
  role: UserRoleDto;

  @ApiProperty({ enum: UserStatusDto })
  status: UserStatusDto;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  preferences: Record<string, any>;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiPropertyOptional()
  emailVerifiedAt?: Date;

  @ApiPropertyOptional()
  phoneVerifiedAt?: Date;

  @ApiProperty()
  twoFactorEnabled: boolean;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  locale: string;

  @ApiProperty()
  isFirstLogin: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isOwner: boolean;

  @ApiProperty()
  isManager: boolean;

  @ApiProperty()
  isStaff: boolean;

  @ApiProperty()
  isClient: boolean;

  @ApiProperty()
  canManageUsers: boolean;

  @ApiProperty()
  canManageSettings: boolean;

  @ApiProperty()
  canAccessPOS: boolean;

  @ApiProperty()
  canManageInventory: boolean;

  @ApiProperty()
  canViewReports: boolean;

  @ApiPropertyOptional()
  daysSinceLastLogin?: number;

  @ApiProperty()
  accountAge: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UsersResponseDto {
  @ApiProperty({ type: [UserDto] })
  users: UserDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class UserStatsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  usersByRole: Record<UserRoleDto, number>;

  @ApiProperty()
  recentLogins: number;
}

export class UserActivityDto {
  @ApiProperty()
  newUsers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  loginActivity: Array<{ date: string; logins: number }>;
}

export class ActivityQueryDto {
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}
