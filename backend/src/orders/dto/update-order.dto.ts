import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

// Every field may change; `null` clears an optional one. The title can be
// changed but never cleared.
export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['title'] as const),
) {
  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;
}
