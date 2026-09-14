import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { PaginatedResult } from '../types/paginated-result.type';

interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: PaginatedResult<T>['meta'];
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | PaginatedApiResponse<unknown>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | PaginatedApiResponse<unknown>> {
    return next.handle().pipe(
      map((data) =>
        this.isPaginatedResult(data)
          ? {
              success: true,
              message: 'Success',
              data: data.data,
              meta: data.meta,
            }
          : { success: true, message: 'Success', data },
      ),
    );
  }

  private isPaginatedResult(value: T): value is T & PaginatedResult<unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'data' in value &&
      'meta' in value &&
      Array.isArray(value.data)
    );
  }
}
