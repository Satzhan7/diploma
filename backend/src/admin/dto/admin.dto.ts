import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { VerificationStatus } from '../../verification/entities/creator-verification.entity';
import { Plan } from '../../plan/plan';

export class ListVerificationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;
}

/** The claim the admin looked at; a newer resubmission makes it stale. */
export class ReviewVerificationDto {
  @ApiProperty({ example: '2026-10-05T10:00:00.000Z' })
  @IsISO8601({ strict: true })
  submittedAt: string;
}

export class RejectVerificationDto extends ReviewVerificationDto {
  @ApiProperty({ example: 'The screenshot does not show the follower count' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 500)
  reason: string;
}

export class ListBrandsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Part of the name, company or email' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class SetPlanDto {
  @ApiProperty({ enum: Plan })
  @IsEnum(Plan)
  plan: Plan;

  /** End of a paid Pro month; null = no end. Ignored for Free. */
  @ApiPropertyOptional({ nullable: true, example: '2026-11-05T00:00:00.000Z' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString({ strict: true })
  proExpiresAt?: string | null;
}
