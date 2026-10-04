import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes';
import { FieldError } from '../common/errors/validation';
import { Order } from './entities/order.entity';

// Fields a brief needs before creators may see it. Category, languages and
// requirements stay optional: they narrow the audience, they do not define
// the job.
const REQUIRED_FIELDS = [
  'title',
  'description',
  'goal',
  'platform',
  'formats',
  'city',
  'budgetMin',
  'budgetMax',
  'deliverables',
  'postBy',
] as const;

/** Today in Kazakhstan (UTC+5), as YYYY-MM-DD. */
export function todayInKazakhstan(now = new Date()): string {
  return new Date(now.getTime() + 5 * 3600_000).toISOString().slice(0, 10);
}

const isBlank = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

/** What keeps a brief from being published; empty when it is complete. */
export function briefProblems(order: Order, now = new Date()): FieldError[] {
  const problems: FieldError[] = REQUIRED_FIELDS.filter((field) =>
    isBlank(order[field]),
  ).map((field) => ({
    field,
    rule: 'isNotEmpty',
    message: `${field} is required`,
  }));

  if (
    order.budgetMin != null &&
    order.budgetMax != null &&
    (order.budgetMin < 1 || order.budgetMin > order.budgetMax)
  ) {
    problems.push({
      field: 'budgetMax',
      rule: 'budgetRange',
      message: 'budgetMax must be at least budgetMin, and both above zero',
    });
  }

  if (order.postBy && order.postBy <= todayInKazakhstan(now)) {
    problems.push({
      field: 'postBy',
      rule: 'futureDate',
      message: 'postBy must be a future date',
    });
  }
  return problems;
}

export function assertBriefComplete(order: Order, now = new Date()): void {
  const details = briefProblems(order, now);
  if (details.length) {
    throw new BadRequestException({
      code: ErrorCode.VALIDATION_FAILED,
      message: 'The brief is incomplete',
      details,
    });
  }
}
