import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';

export const API_VERSION_KEY = 'apiVersion';

/**
 * Decorator to specify API version for endpoints
 */
export const ApiVersion = (version: string) =>
  applyDecorators(
    SetMetadata(API_VERSION_KEY, version),
    ApiHeader({
      name: 'API-Version',
      description: 'API version',
      required: false,
      example: version,
    }),
  );

/**
 * Decorator for REST API controllers with standardized tags and headers
 */
export const RestController = (tag: string, version = '1') =>
  applyDecorators(
    ApiTags(`REST API v${version} - ${tag}`),
    ApiVersion(version),
    ApiHeader({
      name: 'Authorization',
      description: 'Bearer JWT token',
      required: true,
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
  );

/**
 * Decorator for paginated endpoints
 */
export const ApiPaginated = () =>
  applyDecorators(
    ApiHeader({
      name: 'X-Page',
      description: 'Page number',
      required: false,
      example: '1',
    }),
    ApiHeader({
      name: 'X-Limit',
      description: 'Items per page',
      required: false,
      example: '10',
    }),
  );
