import { ValidationPipe } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';
import { toErrorBody } from './http-error.filter';
import { validationExceptionFactory } from './validation';

class AddressDto {
  @IsString()
  city: string;
}

class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

describe('validationExceptionFactory', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: validationExceptionFactory,
  });

  it('sends one { field, rule } per failed rule, nested fields dotted', async () => {
    const error = await pipe
      .transform(
        { email: 'nope', password: 'short', address: { city: 7 } },
        { type: 'body', metatype: SignupDto },
      )
      .catch((e: unknown) => e);

    const body = toErrorBody(error);
    expect(body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
    });
    expect(
      (body.details as { field: string; rule: string }[]).map(
        ({ field, rule }) => `${field}:${rule}`,
      ),
    ).toEqual(['email:isEmail', 'password:minLength', 'address.city:isString']);
  });
});
