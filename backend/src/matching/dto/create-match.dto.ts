import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

export class CreateMatchDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The ID of the brand profile' })
  @IsUUID()
  brandId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The ID of the influencer profile' })
  @IsUUID()
  influencerId: string;

  @ApiProperty({ enum: MatchStatus, example: MatchStatus.PENDING, description: 'The status of the match' })
  @IsEnum(MatchStatus)
  status: MatchStatus;
}