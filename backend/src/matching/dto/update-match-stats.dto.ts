import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateMatchStatsDto {
  @ApiPropertyOptional({ example: 1200, minimum: 0 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  clicks?: number;

  @ApiPropertyOptional({ example: 25000, minimum: 0 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  impressions?: number;

  @ApiPropertyOptional({ example: 3.4, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  engagementRate?: number;

  @ApiPropertyOptional({ example: 240, minimum: 0 })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  followerGrowth?: number;
}
