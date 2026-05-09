import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus } from '../entities/match.entity';

export class CreateMatchDto {
  @ApiProperty({ description: 'ID of the brand', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({ description: 'ID of the influencer', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsNotEmpty()
  influencerId: string;

  @ApiProperty({ 
    description: 'Status of the match', 
    enum: MatchStatus, 
    default: MatchStatus.PENDING,
    example: MatchStatus.PENDING 
  })
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @ApiProperty({ description: 'Message for the match', example: 'Would love to collaborate on our new campaign!' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ 
    description: 'Additional metadata for the match', 
    example: { campaignType: 'Instagram Post', budget: 1000 } 
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}