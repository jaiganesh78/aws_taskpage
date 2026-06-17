import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    const request = context.switchToHttp().getRequest();
    
    // Skip formatting for healthcheck and documentation endpoints if needed
    if (request.url.includes('/api/docs') || request.url.includes('/health')) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => {
        // If data is already in standardized envelope, return as is
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        // If data is paginated, extract paginated details
        if (data && typeof data === 'object' && 'data' in data && 'pagination' in data) {
          return {
            success: true,
            data: data.data,
            pagination: data.pagination,
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
