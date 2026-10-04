import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MAIL_LANGUAGES, MailLanguage } from '../../mail/templates';

export class ResendCodeDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: MAIL_LANGUAGES,
    required: false,
    description: 'Email language (default ru)',
  })
  @IsOptional()
  @IsIn(MAIL_LANGUAGES)
  language?: MailLanguage;
}
