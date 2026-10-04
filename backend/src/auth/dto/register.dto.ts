import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';
import { MAIL_LANGUAGES, MailLanguage } from '../../mail/templates';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    enum: [UserRole.BRAND, UserRole.INFLUENCER],
    description: 'User role',
  })
  @IsIn([UserRole.BRAND, UserRole.INFLUENCER])
  role: UserRole;

  @ApiProperty({
    enum: MAIL_LANGUAGES,
    required: false,
    description: 'Email language (default ru)',
  })
  @IsOptional()
  @IsIn(MAIL_LANGUAGES)
  language?: MailLanguage;
}
