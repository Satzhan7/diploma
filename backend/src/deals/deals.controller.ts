import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Page } from '../common/dto/pagination-query.dto';
import { DealsService } from './deals.service';
import { DealView } from './deal-view';
import { ListDealsQueryDto } from './dto/list-deals-query.dto';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'Deals the current user takes part in' })
  findMine(
    @GetCurrentUser('sub') userId: string,
    @GetCurrentUser('role') role: UserRole,
    @Query() query: ListDealsQueryDto,
  ): Promise<Page<DealView>> {
    return this.dealsService.findForUser({ id: userId, role }, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One deal (participants only)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('sub') userId: string,
    @GetCurrentUser('role') role: UserRole,
  ): Promise<DealView> {
    return this.dealsService.findOneForUser(id, { id: userId, role });
  }
}
