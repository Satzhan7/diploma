import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Put,
  Delete,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { MatchingService, UpdateMatchStatsDto } from './matching.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchStatus, Match } from './entities/match.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('matching')
@ApiBearerAuth()
@Controller('matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post()
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Create a new match' })
  @ApiResponse({ status: 201, description: 'The match has been successfully created.', type: Match })
  create(@Body() createMatchDto: CreateMatchDto): Promise<Match> {
    return this.matchingService.create(createMatchDto);
  }

  @Get()
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get all matches' })
  @ApiResponse({ status: 200, description: 'Return all matches.', type: [Match] })
  findAll(): Promise<Match[]> {
    return this.matchingService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get a match by id' })
  @ApiResponse({ status: 200, description: 'Return the match.', type: Match })
  @ApiResponse({ status: 404, description: 'Match not found.' })
  findOne(@Param('id') id: string): Promise<Match> {
    return this.matchingService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Update a match' })
  @ApiResponse({ status: 200, description: 'The match has been successfully updated.', type: Match })
  @ApiResponse({ status: 404, description: 'Match not found.' })
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto): Promise<Match> {
    return this.matchingService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Delete a match' })
  @ApiResponse({ status: 200, description: 'The match has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Match not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.matchingService.remove(id);
  }

  @Get('user/matches')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get matches for the current user' })
  @ApiResponse({ status: 200, description: 'Return all matches for the current user.', type: [Match] })
  getMatchesForUser(@Request() req): Promise<Match[]> {
    return this.matchingService.getMatchesForUser(req.user.id);
  }

  @Patch(':id/stats')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Update match statistics' })
  @ApiResponse({ status: 200, description: 'The match statistics have been successfully updated.', type: Match })
  @ApiResponse({ status: 404, description: 'Match not found.' })
  updateStats(@Param('id') id: string, @Body() statsDto: UpdateMatchStatsDto): Promise<Match> {
    return this.matchingService.updateMatchStats(id, statsDto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Mark a match as completed' })
  @ApiResponse({ status: 200, description: 'The match has been successfully completed.', type: Match })
  @ApiResponse({ status: 404, description: 'Match not found.' })
  completeMatch(@Param('id') id: string): Promise<Match> {
    return this.matchingService.completeMatch(id);
  }

  @Get('recommendations/influencers')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Get recommended influencers for brand' })
  @ApiResponse({ status: 200, description: 'Return recommended influencers for the brand.' })
  getRecommendedInfluencers(
    @GetCurrentUser() user: any,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    return this.matchingService.getRecommendedInfluencersForBrand(user.id, limit);
  }

  @Get('recommendations/brands')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get recommended brands for influencer' })
  @ApiResponse({ status: 200, description: 'Return recommended brands for the influencer.' })
  getRecommendedBrands(
    @GetCurrentUser() user: any,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    return this.matchingService.getRecommendedBrandsForInfluencer(user.id, limit);
  }

  @Post(':id/accept')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Accept a match' })
  @ApiResponse({ status: 200, description: 'The match has been successfully accepted.', type: Match })
  @ApiResponse({ status: 404, description: 'Match not found.' })
  acceptMatch(@Param('id') id: string): Promise<Match> {
    return this.matchingService.acceptMatch(id);
  }

  @Post(':id/reject')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Reject a match' })
  @ApiResponse({ status: 200, description: 'The match has been successfully rejected.', type: Match })
  @ApiResponse({ status: 404, description: 'Match not found.' })
  rejectMatch(@Param('id') id: string): Promise<Match> {
    return this.matchingService.rejectMatch(id);
  }

  @Post('calculate')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Calculate match score between brand and influencer' })
  @ApiResponse({ status: 200, description: 'Return match score calculation.' })
  calculateMatch(
    @Body('brandId') brandId: string,
    @Body('influencerId') influencerId: string,
  ) {
    return this.matchingService.calculateMatchScore(brandId, influencerId);
  }
}