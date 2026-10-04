import { IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '042917',
    description: 'The 6-digit code from the email',
  })
  @Matches(/^\d{6}$/)
  code: string;
}
