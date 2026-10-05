import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

/** Multipart fields next to the `file` screenshot; they arrive as strings. */
export class SubmitVerificationDto {
  @ApiProperty({ example: 48000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  followers: number;

  /** Percent, e.g. 6.8. */
  @ApiProperty({ example: 6.8 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  engagementRate: number;
}
