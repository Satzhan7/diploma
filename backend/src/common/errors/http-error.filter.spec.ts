import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { apiError, ErrorCode } from './error-codes';
import { toErrorBody } from './http-error.filter';

describe('toErrorBody', () => {
  it('keeps the code and message from apiError()', () => {
    expect(
      toErrorBody(
        new NotFoundException(
          apiError(ErrorCode.ORDER_NOT_FOUND, 'Order with ID 1 not found'),
        ),
      ),
    ).toEqual({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
      message: 'Order with ID 1 not found',
    });
  });

  it('derives a generic code from the status when none is given', () => {
    expect(toErrorBody(new ForbiddenException('nope'))).toEqual({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'nope',
    });
    expect(toErrorBody(new ConflictException()).code).toBe('CONFLICT');
    expect(toErrorBody(new ThrottlerException())).toMatchObject({
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
    });
  });

  it('maps ValidationPipe errors to VALIDATION_FAILED with details', () => {
    expect(
      toErrorBody(
        new BadRequestException(['email must be an email', 'name too short']),
      ),
    ).toEqual({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      details: ['email must be an email', 'name too short'],
    });
  });

  it('hides internal messages on 5xx and unknown errors', () => {
    expect(
      toErrorBody(
        new InternalServerErrorException('Failed: relation "x" violates FK'),
      ),
    ).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(toErrorBody(new Error('db password is hunter2'))).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('keeps the 4xx status of exposed http-errors (body-parser)', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), {
      status: 413,
      statusCode: 413,
      expose: true,
      type: 'entity.too.large',
    });
    expect(toErrorBody(tooLarge)).toEqual({
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'request entity too large',
    });
    // Multer's file size limit arrives as Nest's PayloadTooLargeException.
    expect(
      toErrorBody(new PayloadTooLargeException('File too large')),
    ).toMatchObject({ statusCode: 413, code: 'PAYLOAD_TOO_LARGE' });
    // Not exposed, or not a client error: still a hidden 500.
    const hidden = Object.assign(new Error('secret'), { status: 400 });
    expect(toErrorBody(hidden).statusCode).toBe(500);
    const server = Object.assign(new Error('secret'), {
      status: 503,
      expose: true,
    });
    expect(toErrorBody(server)).toMatchObject({
      statusCode: 500,
      message: 'Internal server error',
    });
  });

  it('keeps a plain string HttpException message', () => {
    expect(
      toErrorBody(new HttpException('Custom', HttpStatus.PAYMENT_REQUIRED)),
    ).toEqual({ statusCode: 402, code: 'BAD_REQUEST', message: 'Custom' });
  });
});
