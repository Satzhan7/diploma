import { IsString, IsNumber, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ example: 'TechCorp' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/logo.jpg' })
  @IsUrl()
  avatarUrl: string;

  @ApiProperty({ example: 'Leading technology company' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  industry: string;

  @ApiProperty({ example: 'San Francisco, CA' })
  @IsString()
  location: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  activeOrders: number;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  totalSpent: number;
} 