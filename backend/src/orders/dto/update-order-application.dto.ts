import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApplicationStatus } from '../entities/order-application.entity';

export class UpdateOrderApplicationDto {
  @ApiProperty({
    description: 'The updated message or cover letter from the applicant',
    example:
      'I would like to work on this project because of my expertise in this field.',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description: 'The updated proposed price by the applicant',
    example: 1000,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  proposedPrice?: number;

  @ApiProperty({
    description: 'The status of the application',
    enum: ApplicationStatus,
    example: ApplicationStatus.ACCEPTED,
    required: false,
  })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}
