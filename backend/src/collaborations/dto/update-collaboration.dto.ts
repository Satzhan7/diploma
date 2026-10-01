import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CollaborationStatus } from '../entities/collaboration.entity';

// Participant and order identifiers are immutable after creation. Their
// reassignment would let an owning brand alter another user's relationship.
export class UpdateCollaborationDto {
  @ApiPropertyOptional({ enum: CollaborationStatus })
  @IsOptional()
  @IsEnum(CollaborationStatus)
  status?: CollaborationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
