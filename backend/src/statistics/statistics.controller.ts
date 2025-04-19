import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatisticsService } from './statistics.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@ApiTags('statistics')
@ApiBearerAuth()
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('brand')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Get brand statistics' })
  @ApiResponse({ status: 200, description: 'Return brand statistics.' })
  getBrandStats(
    @GetCurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('influencerId') influencerId?: string,
    @Query('category') category?: string,
  ) {
    return this.statisticsService.getBrandStats(userId, {
      startDate,
      endDate,
      influencerId,
      category,
    });
  }

  @Get('influencer')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get influencer statistics' })
  @ApiResponse({ status: 200, description: 'Return influencer statistics.' })
  getInfluencerStats(
    @GetCurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('brandId') brandId?: string,
    @Query('category') category?: string,
  ) {
    return this.statisticsService.getInfluencerStats(userId, {
      startDate,
      endDate,
      brandId,
      category,
    });
  }
} 