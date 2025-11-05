/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto, PaginatedResponseDto } from '../dto/common.dto';
import { asRecord, getNumber } from '../../../common/utils/safe';

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable()
export class RestResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T> | PaginatedResponseDto<any>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T> | PaginatedResponseDto<any>> {
    const request = context.switchToHttp().getRequest<unknown>();
    const url =
      request && typeof request === 'object' ? (request as any).url : '';
    const isApiRoute = typeof url === 'string' && url.startsWith('/api');

    // Only transform API routes
    if (!isApiRoute) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => {
        // Already formatted response (has `success` flag)
        if (
          data &&
          typeof data === 'object' &&
          'success' in (data as Record<string, unknown>)
        ) {
          return data as any;
        }

        // Handle paginated responses
        if (this.isPaginatedData(data)) {
          const d = asRecord(data as unknown);
          const page =
            getNumber(d.pagination as Record<string, unknown>, 'page') ?? 1;
          const limit =
            getNumber(d.pagination as Record<string, unknown>, 'limit') ?? 20;
          const total =
            getNumber(d.pagination as Record<string, unknown>, 'total') ?? 0;

          return new PaginatedResponseDto(
            (d.data as unknown[]) || [],
            page,
            limit,
            total,
          );
        }

        // Regular single response
        return new ApiResponseDto(data as T);
      }),
    );
  }

  private isPaginatedData(data: unknown): data is PaginatedData<any> {
    if (!data || typeof data !== 'object') return false;
    const d = asRecord(data);
    return (
      Array.isArray(d.data) &&
      d.pagination &&
      typeof (d.pagination as any).page === 'number' &&
      typeof (d.pagination as any).limit === 'number' &&
      typeof (d.pagination as any).total === 'number'
    );
  }
}
