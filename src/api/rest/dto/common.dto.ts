import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class SearchDto extends PaginationDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'beauty salon',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Sort field',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;

  constructor(data: T, message = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export class PaginatedResponseDto<T> extends ApiResponseDto<T[]> {
  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Success',
  ) {
    super(data, message);

    const totalPages = Math.ceil(total / limit);

    this.pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
