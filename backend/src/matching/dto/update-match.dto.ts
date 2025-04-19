import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

export class UpdateMatchDto {
  @ApiProperty({ enum: MatchStatus, example: MatchStatus.ACCEPTED, description: 'The new status of the match' })
  @IsEnum(MatchStatus)
  status: MatchStatus;

  @IsOptional()
  @IsString()
  message?: string;
}