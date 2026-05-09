import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateOrderApplicationDto {
  @ApiProperty({
    description: 'The message or cover letter from the applicant',
    example: 'I would like to work on this project because of my expertise in this field.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'The proposed price by the applicant (optional)',
    example: 1000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  proposedPrice?: number;
} 