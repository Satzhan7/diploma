import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaborationStatus } from '../entities/collaboration.entity';

export class CreateCollaborationDto {
  @ApiProperty({
    description: 'ID of the brand involved in the collaboration',
    example: 'e87b51c3-6d8f-4389-bee7-77c84dc226fe',
  })
  @IsUUID()
  brandId: string;

  @ApiProperty({
    description: 'ID of the influencer involved in the collaboration',
    example: 'f92a51c3-6d8f-4389-bee7-77c84dc226fe',
  })
  @IsUUID()
  influencerId: string;

  @ApiProperty({
    description: 'ID of the related order (optional)',
    example: 'a45b51c3-6d8f-4389-bee7-77c84dc226fe',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty({
    description: 'Status of the collaboration',
    enum: CollaborationStatus,
    default: CollaborationStatus.ACTIVE,
    example: 'active',
  })
  @IsEnum(CollaborationStatus)
  @IsOptional()
  status?: CollaborationStatus;

  @ApiProperty({
    description: 'Notes about the collaboration',
    example: 'Instagram campaign for product launch',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
} 