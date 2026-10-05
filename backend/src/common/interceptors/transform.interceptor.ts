import {
  Injectable,
  Logger,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If data is undefined or null, return it directly
        if (data === undefined || data === null) {
          return data;
        }
        // File downloads go to the response untouched.
        if (data instanceof StreamableFile) {
          return data;
        }

        try {
          // Serialize via class-transformer so @Exclude fields (password,
          // refreshToken) are stripped, while handling circular references.
          return instanceToPlain(data, { enableCircularCheck: true });
        } catch (error) {
          // Fail closed: the raw entities may still carry @Exclude fields.
          this.logger.error(`Error in transform interceptor: ${error.message}`);
          throw new InternalServerErrorException();
        }
      }),
    );
  }
}
