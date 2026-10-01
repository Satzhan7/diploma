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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { MatchingService, UpdateMatchStatsDto } from './matching.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match } from './entities/match.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

// All matching routes require an authenticated session. Mutating operations
// additionally require the caller to be a participant of the match — see
// MatchingService.findOwnedMatch for enforcement.
@ApiTags('matching')
@ApiBearerAuth()
@Controller('matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post()
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({
    summary: 'Create a new match (the caller must be a participant)',
  })
  @ApiResponse({
    status: 201,
    description: 'The match has been successfully created.',
    type: Match,
  })
  create(
    @GetCurrentUser('sub') userId: string,
    @Body() createMatchDto: CreateMatchDto,
  ): Promise<Match> {
    return this.matchingService.create(createMatchDto, userId);
  }

  @Post('interests/:brandId')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({
    summary: 'Express interest in a brand (influencer is derived from JWT)',
  })
  createInterest(
    @Param('brandId') brandId: string,
    @GetCurrentUser('sub') influencerId: string,
  ): Promise<Match> {
    return this.matchingService.expressInterest(brandId, influencerId);
  }

  @Get()
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'List matches the current user participates in' })
  @ApiResponse({
    status: 200,
    description: 'Return matches scoped to the current user.',
    type: [Match],
  })
  findAll(@GetCurrentUser('sub') userId: string): Promise<Match[]> {
    return this.matchingService.findAllForUser(userId);
  }

  @Get('user/matches')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({
    summary: 'Alias for GET /matching, kept for frontend compatibility',
  })
  getMatchesForUser(@GetCurrentUser('sub') userId: string): Promise<Match[]> {
    return this.matchingService.getMatchesForUser(userId);
  }

  @Get('recommendations/influencers')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Get recommended influencers for brand' })
  getRecommendedInfluencers(
    @GetCurrentUser() user: any,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    return this.matchingService.getRecommendedInfluencersForBrand(
      user.id,
      limit,
    );
  }

  @Get('recommendations/brands')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get recommended brands for influencer' })
  getRecommendedBrands(
    @GetCurrentUser() user: any,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    return this.matchingService.getRecommendedBrandsForInfluencer(
      user.id,
      limit,
    );
  }

  @Post('calculate')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({
    summary: 'Calculate the match score between a brand and influencer',
  })
  calculateMatch(
    @Body('brandId') brandId: string,
    @Body('influencerId') influencerId: string,
  ) {
    return this.matchingService.calculateMatchScore(brandId, influencerId);
  }

  @Get(':id')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get a match by id (must be a participant)' })
  @ApiResponse({ status: 404, description: 'Match not found.' })
  @ApiResponse({
    status: 403,
    description: 'Caller is not a participant of this match.',
  })
  findOne(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<Match> {
    return this.matchingService.findOneForUser(id, userId);
  }

  @Put(':id')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Update a match the caller participates in' })
  update(
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
    @GetCurrentUser('sub') userId: string,
  ): Promise<Match> {
    return this.matchingService.update(id, updateMatchDto, userId);
  }

  @Patch(':id/stats')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({
    summary: 'Update statistics on a match the caller participates in',
  })
  updateStats(
    @Param('id') id: string,
    @Body() statsDto: UpdateMatchStatsDto,
    @GetCurrentUser('sub') userId: string,
  ): Promise<Match> {
    return this.matchingService.updateMatchStats(id, statsDto, userId);
  }

  @Patch(':id/complete')
  @Roles(UserRole.BRAND)
  @ApiOperation({
    summary: 'Mark a match as completed (only the owning brand)',
  })
  completeMatch(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<Match> {
    return this.matchingService.completeMatch(id, userId);
  }

  @Post(':id/accept')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Accept a match the caller participates in' })
  acceptMatch(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<Match> {
    return this.matchingService.acceptMatch(id, userId);
  }

  @Post(':id/reject')
  @Roles(UserRole.BRAND, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Reject a match the caller participates in' })
  rejectMatch(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<Match> {
    return this.matchingService.rejectMatch(id, userId);
  }
}
