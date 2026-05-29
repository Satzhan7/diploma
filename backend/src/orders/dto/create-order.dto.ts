import { IsString, IsNumber, IsDateString, MinLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'Summer Campaign', description: 'The title of the order' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Looking for fashion influencers...', description: 'Detailed description of the order' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 1000, description: 'Budget for the order in USD' })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiProperty({ example: 'fashion', description: 'Category of the order' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Must have at least 10k followers...', description: 'Specific requirements for influencers' })
  @IsString()
  requirements: string;

  @ApiProperty({ example: '2024-12-31', description: 'Deadline for the order' })
  @IsDateString()
  deadline: string;
} 