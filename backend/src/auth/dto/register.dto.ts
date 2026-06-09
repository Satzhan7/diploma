import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: [UserRole.BRAND, UserRole.INFLUENCER], description: 'User role' })
  @IsIn([UserRole.BRAND, UserRole.INFLUENCER])
  role: UserRole;
} 