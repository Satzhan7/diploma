import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMatchDto } from './create-match.dto';
import { MatchStatus } from '../entities/match.entity';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @ApiProperty({ 
    description: 'Status of the match', 
    enum: MatchStatus,
    example: MatchStatus.ACCEPTED 
  })
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @ApiProperty({ description: 'Message for the match', example: 'Looking forward to working with you!' })
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

  @ApiProperty({ description: 'Engagement rate of the collaboration', example: 3.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  engagementRate?: number;

  @ApiProperty({ description: 'Conversion rate of the collaboration', example: 2.1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  conversionRate?: number;

  @ApiProperty({ description: 'Click-through rate of the collaboration', example: 1.8 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  clickThroughRate?: number;
}