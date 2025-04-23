import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus, MatchStats } from './entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UsersService } from '../users/users.service';
import { MessagesService } from '../messages/messages.service';
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
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly messagesService: MessagesService,
  ) {}

  async create(createMatchDto: CreateMatchDto): Promise<Match> {
    const matchData = { ...createMatchDto }; 
    const match = this.matchRepository.create(matchData);
    return await this.matchRepository.save(match);
  }

  async findAll(): Promise<Match[]> {
    return await this.matchRepository.find({
      relations: ['brand', 'influencer'],
    });
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id },
      relations: ['brand', 'influencer', 'brand.profile', 'influencer.profile'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID "${id}" not found`);
    }

    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.findOne(id);
    Object.assign(match, updateMatchDto);
    return await this.matchRepository.save(match);
  }

  async remove(id: string): Promise<void> {
    const result = await this.matchRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Match with ID "${id}" not found`);
    }
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

  async acceptMatch(matchId: string): Promise<Match> {
    const match = await this.findOne(matchId);
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Match is not pending');
    }
    match.status = MatchStatus.ACCEPTED;
    const updatedMatch = await this.matchRepository.save(match);

    const existingConversation = await this.messagesService.findConversationBetweenUsers(
      match.brandId,
      match.influencerId,
    );

    if (!existingConversation) {
      await this.messagesService.createConversation(match.brandId, {
        recipientId: match.influencerId,
        initialMessage: 'Match accepted! Let\'s start collaborating.',
      });
    }

    return updatedMatch;
  }

  async rejectMatch(matchId: string): Promise<Match> {
    const match = await this.findOne(matchId);
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Match is not pending');
    }
    match.status = MatchStatus.REJECTED;
    return this.matchRepository.save(match);
  }

  async getMatchesForUser(userId: string): Promise<Match[]> {
     return this.matchRepository.find({
      where: [
        { brandId: userId },
        { influencerId: userId },
      ],
      relations: ['brand', 'influencer', 'brand.profile', 'influencer.profile'],
    });
  }

  // Method to update match statistics
  async updateMatchStats(id: string, statsDto: UpdateMatchStatsDto): Promise<Match> {
    const match = await this.findOne(id);
    
    match.stats = match.stats || {};

    if (statsDto.clicks !== undefined) {
      match.stats.clicks = (match.stats.clicks || 0) + statsDto.clicks;
    }
    
    if (statsDto.impressions !== undefined) {
      match.stats.impressions = (match.stats.impressions || 0) + statsDto.impressions;
    }
    
    if (statsDto.engagementRate !== undefined) {
      match.stats.engagementRate = statsDto.engagementRate; 
    }
    
    if (statsDto.followerGrowth !== undefined) {
      match.stats.followerGrowth = (match.stats.followerGrowth || 0) + statsDto.followerGrowth;
    }
    
    return await this.matchRepository.save(match);
  }
  
  // Method to complete a match
  async completeMatch(matchId: string): Promise<Match> {
    const match = await this.findOne(matchId);
    if (match.status !== MatchStatus.ACCEPTED) {
       throw new BadRequestException('Match must be accepted to be completed');
    }
    match.status = MatchStatus.COMPLETED;
    return this.matchRepository.save(match);
  }

  // Method to get recommended influencers for a brand
  async getRecommendedInfluencersForBrand(brandId: string, limit: number = 10): Promise<any[]> {
    const brand = await this.usersService.findById(brandId); 
    if (!brand || brand.role !== 'brand') {
      throw new NotFoundException('Brand not found');
    }
    const brandProfile = await this.profilesService.findByUserId(brandId);
    const brandCategories = brandProfile?.categories || [];
    
    // Call findInfluencers without limit for now, assuming it fetches all or based on category
    // TODO: Refine this call based on actual UsersService implementation
    const influencers = await this.usersService.findInfluencers(); // Removed limit parameter 
    
    const existingMatches = await this.matchRepository.find({ where: { brandId } });
    const existingInfluencerIds = existingMatches.map(match => match.influencerId);
    
    const recommendedInfluencers = influencers.filter(
      influencer => !existingInfluencerIds.includes(influencer.id)
    );
    
    return recommendedInfluencers.map(influencer => {
      const influencerProfile = influencer.profile; 
      const influencerCategories = influencerProfile?.categories || [];
      const categoryMatch = this.calculateCategoryMatch(brandCategories, influencerCategories);
      const overallScore = categoryMatch * 100; 

      return {
        user: influencer,
        matchScore: overallScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit); // Apply limit after sorting
  }
  
  // Method to get recommended brands for an influencer
  async getRecommendedBrandsForInfluencer(influencerId: string, limit: number = 10): Promise<any[]> {
     const influencer = await this.usersService.findById(influencerId); 
    if (!influencer || influencer.role !== 'influencer') {
      throw new NotFoundException('Influencer not found');
    }
    const influencerProfile = await this.profilesService.findByUserId(influencerId);
    const influencerCategories = influencerProfile?.categories || [];
    
    // Call findBrands without limit for now, assuming it fetches all or based on category
    // TODO: Refine this call based on actual UsersService implementation
    const brands = await this.usersService.findBrands(); // Removed limit parameter
    
    const existingMatches = await this.matchRepository.find({ where: { influencerId } });
    const existingBrandIds = existingMatches.map(match => match.brandId);
    
    const recommendedBrands = brands.filter(
      brand => !existingBrandIds.includes(brand.id)
    );

    return recommendedBrands.map(brand => {
       const brandProfile = brand.profile; 
       const brandCategories = brandProfile?.categories || [];
       const categoryMatch = this.calculateCategoryMatch(influencerCategories, brandCategories);
       const overallScore = categoryMatch * 100; 

      return {
        user: brand, 
        matchScore: overallScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit); // Apply limit after sorting
  }

  async calculateMatchScore(brandId: string, influencerId: string) {
    const [brand, influencer] = await Promise.all([
      this.usersService.findById(brandId), 
      this.usersService.findById(influencerId) 
    ]);

    if (!brand || !influencer) {
      throw new NotFoundException('Brand or Influencer not found');
    }

    const brandProfile = await this.profilesService.findByUserId(brandId);
    const influencerProfile = await this.profilesService.findByUserId(influencerId);

    // Engagement rate is on the Match entity, not Profile. Use 0 or fetch differently if needed.
    const factors = {
      categoryMatch: this.calculateCategoryMatch(brandProfile?.categories || [], influencerProfile?.categories || []),
      audienceMatch: Math.random(), // Placeholder - needs implementation
      engagementScore: 0, // influencerProfile?.engagementRate || 0, // This property doesn't exist on Profile
    };

    const weights = {
      categoryMatch: 0.4,
      audienceMatch: 0.3,
      engagementScore: 0.3,
    };

    const totalScore = Object.entries(factors).reduce(
      (sum, [key, value]) => sum + value * (weights[key as keyof typeof weights] || 0),
      0
    );

    return {
      ...factors,
      totalScore: Math.min(Math.round(totalScore * 100), 100)
    };
  }

  // Helper function for category match calculation
  private calculateCategoryMatch(arr1: string[], arr2: string[]): number {
    if (!arr1 || !arr2 || arr1.length === 0) return 0;
    const intersection = arr1.filter(c => arr2.includes(c));
    return intersection.length / arr1.length; // Match based on brand categories
  }
}