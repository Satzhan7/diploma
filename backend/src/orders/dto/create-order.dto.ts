import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BRIEF_CITIES,
  BRIEF_FORMATS,
  BRIEF_LANGUAGES,
  BriefCity,
  BriefFormat,
  BriefGoal,
  BriefLanguage,
  BriefPlatform,
} from '../brief-options';
import { CATEGORIES } from '../../categories/categories.controller';

/** Upper bound for a budget, ₸ (a sanity limit, not a business rule). */
export const MAX_BUDGET = 100_000_000;

// `POST /orders` saves a draft: only the title is required. Publishing checks
// that the brief is complete (brief-completeness.ts).
export class CreateOrderDto {
  @ApiProperty({ example: 'Launch of the autumn menu' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: 'We open a second café in Almaty...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: BriefGoal })
  @IsOptional()
  @IsEnum(BriefGoal)
  goal?: BriefGoal | null;

  @ApiPropertyOptional({ enum: BriefPlatform })
  @IsOptional()
  @IsEnum(BriefPlatform)
  platform?: BriefPlatform | null;

  @ApiPropertyOptional({ enum: BRIEF_FORMATS, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(BRIEF_FORMATS.length)
  @IsIn(BRIEF_FORMATS, { each: true })
  formats?: BriefFormat[] | null;

  @ApiPropertyOptional({ enum: BRIEF_CITIES })
  @IsOptional()
  @IsIn(BRIEF_CITIES)
  city?: BriefCity | null;

  @ApiPropertyOptional({ enum: BRIEF_LANGUAGES, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(BRIEF_LANGUAGES.length)
  @IsIn(BRIEF_LANGUAGES, { each: true })
  languages?: BriefLanguage[] | null;

  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string | null;

  @ApiPropertyOptional({ example: 60000, description: '₸ per creator' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_BUDGET)
  budgetMin?: number | null;

  @ApiPropertyOptional({ example: 120000, description: '₸ per creator' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_BUDGET)
  budgetMax?: number | null;

  @ApiPropertyOptional({ example: '1 Reel + 3 Stories' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliverables?: string | null;

  @ApiPropertyOptional({ example: 'Tag @cafe.daryn' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  requirements?: string | null;

  @ApiPropertyOptional({ example: '2026-10-15', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString({ strict: true })
  @MaxLength(10)
  postBy?: string | null;
}
