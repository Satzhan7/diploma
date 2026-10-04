import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from './error-codes';
import { FieldError } from './validation';

export interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  /** Failed fields from ValidationPipe (`validationExceptionFactory`). */
  details?: FieldError[] | string[];
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.GONE]: ErrorCode.GONE,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
};

/**
 * Every HTTP error leaves as { statusCode, code, message, details? }.
 * Throw sites set `code` with apiError(); otherwise it is derived from the
 * status. 5xx messages are replaced so internals never reach the client.
 */
export function toErrorBody(exception: unknown): ErrorBody {
  const client = exposedClientError(exception);
  if (client) {
    return {
      statusCode: client.status,
      code: CODE_BY_STATUS[client.status] ?? ErrorCode.BAD_REQUEST,
      message: client.message,
    };
  }

  if (!(exception instanceof HttpException)) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    };
  }

  const statusCode = exception.getStatus();
  if (statusCode >= 500) {
    return {
      statusCode,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    };
  }

  const response = exception.getResponse();
  const body = (typeof response === 'object' ? response : {}) as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };

  if (
    body.code === ErrorCode.VALIDATION_FAILED &&
    Array.isArray(body.details)
  ) {
    return {
      statusCode,
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Validation failed',
      details: body.details as FieldError[],
    };
  }

  // A ValidationPipe without the factory throws BadRequest with message: string[].
  if (Array.isArray(body.message)) {
    return {
      statusCode,
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Validation failed',
      details: body.message.map(String),
    };
  }

  return {
    statusCode,
    code:
      typeof body.code === 'string'
        ? body.code
        : (CODE_BY_STATUS[statusCode] ?? ErrorCode.BAD_REQUEST),
    message:
      typeof body.message === 'string' ? body.message : exception.message,
  };
}

/**
 * body-parser and other `http-errors` (e.g. 413 entity too large) are not
 * HttpExceptions. Like Nest's default filter, keep their 4xx status; they set
 * `expose` only for messages that are safe to show the client.
 */
function exposedClientError(
  exception: unknown,
): { status: number; message: string } | null {
  if (exception instanceof HttpException || typeof exception !== 'object') {
    return null;
  }
  const err = exception as {
    status?: unknown;
    expose?: unknown;
    message?: unknown;
  } | null;
  if (
    err?.expose === true &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500
  ) {
    return {
      status: err.status,
      message: typeof err.message === 'string' ? err.message : 'Bad request',
    };
  }
  return null;
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const body = toErrorBody(exception);
    if (body.statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    const res = host.switchToHttp().getResponse<Response>();
    if (res.headersSent) return;
    res.status(body.statusCode).json(body);
  }
}
