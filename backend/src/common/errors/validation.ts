import { BadRequestException, ValidationError } from '@nestjs/common';
import { ErrorCode } from './error-codes';

/** One failed rule on one field; `rule` is the class-validator constraint. */
export interface FieldError {
  field: string;
  rule: string;
  message: string;
}

/** Flattens nested ValidationErrors into dotted field paths. */
export function toFieldErrors(
  errors: ValidationError[],
  parent = '',
): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(
      ([rule, message]) => ({ field, rule, message }),
    );
    return [...own, ...toFieldErrors(error.children ?? [], field)];
  });
}

/** ValidationPipe `exceptionFactory`: the frontend maps `details` to fields. */
export const validationExceptionFactory = (errors: ValidationError[]) =>
  new BadRequestException({
    code: ErrorCode.VALIDATION_FAILED,
    message: 'Validation failed',
    details: toFieldErrors(errors),
  });
