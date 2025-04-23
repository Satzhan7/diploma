import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassSerializerInterceptor } from '@nestjs/common';

@Injectable()
export class TransformInterceptor extends ClassSerializerInterceptor {
  constructor() {
    super(null, {
      strategy: 'excludeAll',
      enableCircularCheck: true,
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // If data is undefined or null, return it directly
        if (data === undefined || data === null) {
          return data;
        }

        try {
          // Handle circular references
          const seen = new WeakSet();
          return JSON.parse(JSON.stringify(data, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular]';
              }
              seen.add(value);
            }
            return value;
          }));
        } catch (error) {
          // If JSON parsing fails, return the original data
          console.warn('Error in transform interceptor:', error.message);
          return data;
        }
      }),
    );
  }
} 