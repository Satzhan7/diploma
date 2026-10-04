import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OrderStatus } from '../entities/order.entity';
import { BRIEF_CITIES, BriefCity, BriefPlatform } from '../brief-options';
import { CATEGORIES } from '../../categories/categories.controller';

/** Creator feed: open briefs, newest first. */
export class ListAvailableOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ enum: BriefPlatform })
  @IsOptional()
  @IsEnum(BriefPlatform)
  platform?: BriefPlatform;

  /** Briefs for this city and briefs open to any city. */
  @ApiPropertyOptional({ enum: BRIEF_CITIES })
  @IsOptional()
  @IsIn(BRIEF_CITIES)
  city?: BriefCity;
}

/** Brand briefs; `status` takes one value or a comma-separated list. */
export class ListBrandOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsEnum(OrderStatus, { each: true })
  status?: OrderStatus[];
}
