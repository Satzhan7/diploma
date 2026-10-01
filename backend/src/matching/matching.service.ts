import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus, MatchStats } from './entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileType, Profile } from '../profiles/entities/profile.entity';

// DTO for updating match statistics
export interface UpdateMatchStatsDto {
  clicks?: number;
  impressions?: number;
  engagementRate?: number;
  followerGrowth?: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly chatsService: ChatsService,
  ) {}

  // Internal helper. Throws NotFound if missing, Forbidden if userId is not
  // a participant. Used by every per-match operation that mutates state.
  private async findOwnedMatch(
    matchId: string,
    userId: string,
  ): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['brand', 'influencer', 'brand.profile', 'influencer.profile'],
    });
    if (!match) {
      throw new NotFoundException(`Match with ID "${matchId}" not found`);
    }
    if (match.brandId !== userId && match.influencerId !== userId) {
      throw new ForbiddenException('You do not have access to this match');
    }
    return match;
  }

  async create(
    createMatchDto: CreateMatchDto,
    requesterId: string,
  ): Promise<Match> {
    // Only let the authenticated user create a match in which they are a
    // participant — prevents users from impersonating someone else's match.
    if (
      createMatchDto.brandId !== requesterId &&
      createMatchDto.influencerId !== requesterId
    ) {
      throw new ForbiddenException(
        'You can only create matches in which you participate',
      );
    }
    // Always start as PENDING. Clients cannot self-accept by passing a status.
    const { status: _ignored, ...safeFields } = createMatchDto;
    const match = this.matchRepository.create({
      ...safeFields,
      status: MatchStatus.PENDING,
    });
    return await this.matchRepository.save(match);
  }

  // Listing returns only matches where the requester is a participant.
  async findAllForUser(userId: string): Promise<Match[]> {
    return this.matchRepository.find({
      where: [{ brandId: userId }, { influencerId: userId }],
      relations: ['brand', 'influencer', 'brand.profile', 'influencer.profile'],
    });
  }

  async findOneForUser(id: string, userId: string): Promise<Match> {
    return this.findOwnedMatch(id, userId);
  }

  async update(
    id: string,
    updateMatchDto: UpdateMatchDto,
    userId: string,
  ): Promise<Match> {
    const match = await this.findOwnedMatch(id, userId);
    // Status transitions and participant fields must go through dedicated
    // endpoints (accept/reject/complete). Strip them here so a participant
    // cannot self-accept, reassign, or close the match via the generic PUT.
    const {
      status: _ignoredStatus,
      brandId: _ignoredBrandId,
      influencerId: _ignoredInfluencerId,
      ...safeFields
    } = updateMatchDto as UpdateMatchDto & {
      brandId?: string;
      influencerId?: string;
    };
    Object.assign(match, safeFields);
    return this.matchRepository.save(match);
  }

  async createMatch(brandId: string, influencerId: string): Promise<Match> {
    const brandUser = await this.usersService.findById(brandId);
    const influencerUser = await this.usersService.findById(influencerId);

    if (!brandUser || brandUser.role !== 'brand') {
      throw new NotFoundException('Brand user not found');
    }
    if (!influencerUser || influencerUser.role !== 'influencer') {
      throw new NotFoundException('Influencer user not found');
    }

    const existingMatch = await this.matchRepository.findOne({
      where: [
        { brandId: brandId, influencerId: influencerId },
        { brandId: influencerId, influencerId: brandId },
      ],
    });

    if (existingMatch) {
      throw new ConflictException('Match already exists');
    }

    const match = this.matchRepository.create({
      brandId: brandId,
      influencerId: influencerId,
      status: MatchStatus.PENDING,
    });

    return this.matchRepository.save(match);
  }

  async acceptMatch(matchId: string, userId: string): Promise<Match> {
    const match = await this.findOwnedMatch(matchId, userId);
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Match is not pending');
    }
    match.status = MatchStatus.ACCEPTED;
    const updatedMatch = await this.matchRepository.save(match);

    // Open or reuse a chat between the two participants and seed it with an
    // introductory message. ChatsService.create returns the existing chat if
    // one already exists, so this is idempotent.
    try {
      const chat = await this.chatsService.create(
        match.brandId,
        match.influencerId,
      );
      await this.chatsService.addMessage(
        chat.id,
        match.brandId,
        "Match accepted! Let's start collaborating.",
      );
    } catch (error) {
      // Acceptance must succeed even if the chat seed fails.
      this.logger.error(
        `Failed to seed chat after match acceptance: ${(error as Error).message}`,
      );
    }

    return updatedMatch;
  }

  async rejectMatch(matchId: string, userId: string): Promise<Match> {
    const match = await this.findOwnedMatch(matchId, userId);
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Match is not pending');
    }
    match.status = MatchStatus.REJECTED;
    return this.matchRepository.save(match);
  }

  async getMatchesForUser(userId: string): Promise<Match[]> {
    return this.findAllForUser(userId);
  }

  // Update match statistics. Both participants can submit telemetry; the brand
  // gates completion separately via completeMatch.
  async updateMatchStats(
    id: string,
    statsDto: UpdateMatchStatsDto,
    userId: string,
  ): Promise<Match> {
    const match = await this.findOwnedMatch(id, userId);

    match.stats = match.stats || {};

    if (statsDto.clicks !== undefined) {
      match.stats.clicks = (match.stats.clicks || 0) + statsDto.clicks;
    }

    if (statsDto.impressions !== undefined) {
      match.stats.impressions =
        (match.stats.impressions || 0) + statsDto.impressions;
    }

    if (statsDto.engagementRate !== undefined) {
      match.stats.engagementRate = statsDto.engagementRate;
    }

    if (statsDto.followerGrowth !== undefined) {
      match.stats.followerGrowth =
        (match.stats.followerGrowth || 0) + statsDto.followerGrowth;
    }

    return this.matchRepository.save(match);
  }

  // Only the owning brand may close out a collaboration.
  async completeMatch(matchId: string, userId: string): Promise<Match> {
    const match = await this.findOwnedMatch(matchId, userId);
    if (match.brandId !== userId) {
      throw new ForbiddenException(
        'Only the owning brand can complete a match',
      );
    }
    if (match.status !== MatchStatus.ACCEPTED) {
      throw new BadRequestException('Match must be accepted to be completed');
    }
    match.status = MatchStatus.COMPLETED;
    return this.matchRepository.save(match);
  }

  // Method to get recommended influencers for a brand
  async getRecommendedInfluencersForBrand(
    brandId: string,
    limit: number = 10,
  ): Promise<any[]> {
    const brand = await this.usersService.findById(brandId);
    if (!brand || brand.role !== 'brand') {
      throw new NotFoundException('Brand not found');
    }
    const brandProfile = await this.profilesService.findByUserId(brandId);
    const brandCategories = brandProfile?.categories || [];

    const influencers = await this.usersService.findInfluencers();

    const existingMatches = await this.matchRepository.find({
      where: { brandId },
    });
    const existingInfluencerIds = existingMatches.map(
      (match) => match.influencerId,
    );

    const recommendedInfluencers = influencers.filter(
      (influencer) => !existingInfluencerIds.includes(influencer.id),
    );

    return recommendedInfluencers
      .map((influencer) => {
        const influencerProfile = influencer.profile;
        const influencerCategories = influencerProfile?.categories || [];
        const categoryMatch = this.calculateCategoryMatch(
          brandCategories,
          influencerCategories,
        );
        const overallScore = categoryMatch * 100;

        return {
          user: influencer,
          matchScore: overallScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  // Method to get recommended brands for an influencer
  async getRecommendedBrandsForInfluencer(
    influencerId: string,
    limit: number = 10,
  ): Promise<any[]> {
    const influencer = await this.usersService.findById(influencerId);
    if (!influencer || influencer.role !== 'influencer') {
      throw new NotFoundException('Influencer not found');
    }
    const influencerProfile =
      await this.profilesService.findByUserId(influencerId);
    const influencerCategories = influencerProfile?.categories || [];

    const brands = await this.usersService.findBrands();

    const existingMatches = await this.matchRepository.find({
      where: { influencerId },
    });
    const existingBrandIds = existingMatches.map((match) => match.brandId);

    const recommendedBrands = brands.filter(
      (brand) => !existingBrandIds.includes(brand.id),
    );

    return recommendedBrands
      .map((brand) => {
        const brandProfile = brand.profile;
        const brandCategories = brandProfile?.categories || [];
        const categoryMatch = this.calculateCategoryMatch(
          influencerCategories,
          brandCategories,
        );
        const overallScore = categoryMatch * 100;

        return {
          user: brand,
          matchScore: overallScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  async calculateMatchScore(brandId: string, influencerId: string) {
    const [brand, influencer] = await Promise.all([
      this.usersService.findById(brandId),
      this.usersService.findById(influencerId),
    ]);

    if (!brand || !influencer) {
      throw new NotFoundException('Brand or Influencer not found');
    }

    const brandProfile = await this.profilesService.findByUserId(brandId);
    const influencerProfile =
      await this.profilesService.findByUserId(influencerId);

    const factors = {
      categoryMatch: this.calculateCategoryMatch(
        brandProfile?.categories || [],
        influencerProfile?.categories || [],
      ),
      audienceMatch: this.calculateAudienceMatch(
        brandProfile,
        influencerProfile,
      ),
      engagementScore: this.calculateEngagementScore(influencer),
    };

    const weights = {
      categoryMatch: 0.4,
      audienceMatch: 0.3,
      engagementScore: 0.3,
    };

    const totalScore = Object.entries(factors).reduce(
      (sum, [key, value]) =>
        sum + value * (weights[key as keyof typeof weights] || 0),
      0,
    );

    return {
      ...factors,
      totalScore: Math.min(Math.round(totalScore * 100), 100),
    };
  }

  // Jaccard overlap of category tags. Symmetric and deterministic.
  private calculateCategoryMatch(arr1: string[], arr2: string[]): number {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    const set1 = new Set(arr1.map((s) => s.toLowerCase()));
    const set2 = new Set(arr2.map((s) => s.toLowerCase()));
    let intersection = 0;
    set1.forEach((c) => {
      if (set2.has(c)) intersection += 1;
    });
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  // Audience match: combines language overlap (Jaccard) and a content-types overlap if present.
  // Returns 0..1 deterministically based on stored profile data.
  private calculateAudienceMatch(
    brandProfile: Profile | undefined | null,
    influencerProfile: Profile | undefined | null,
  ): number {
    if (!brandProfile || !influencerProfile) return 0;
    const langScore = this.calculateCategoryMatch(
      brandProfile.languages || [],
      influencerProfile.languages || [],
    );
    const contentScore = this.calculateCategoryMatch(
      brandProfile.contentTypes || [],
      influencerProfile.contentTypes || [],
    );
    if (
      !brandProfile.languages?.length ||
      !influencerProfile.languages?.length
    ) {
      return contentScore;
    }
    if (
      !brandProfile.contentTypes?.length ||
      !influencerProfile.contentTypes?.length
    ) {
      return langScore;
    }
    return 0.6 * langScore + 0.4 * contentScore;
  }

  // Engagement score normalised to 0..1 from User.engagementRate (decimal 0..1) and follower bracket.
  private calculateEngagementScore(influencer: any): number {
    const rate = Number(influencer?.engagementRate) || 0;
    const followers = Number(influencer?.followers) || 0;
    const followerBonus = Math.min(followers / 100000, 1);
    return Math.min(0.7 * Math.min(rate, 1) + 0.3 * followerBonus, 1);
  }
}
