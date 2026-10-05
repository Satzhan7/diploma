import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ShortlistApplicationDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  shortlisted: boolean;
}
