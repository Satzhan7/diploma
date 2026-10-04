import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DealStatus } from '../entities/deal.entity';

export class ListDealsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DealStatus })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;
}
