import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Match } from '../matching/entities/match.entity';
import { Message } from '../messages/entities/message.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { DailyStat } from './dto/daily-stat.dto'; // Import DailyStat DTO

interface StatsFilters {
  startDate?: string;
  endDate?: string;
  influencerId?: string;
  brandId?: string;
  category?: string;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getBrandStats(userId: string, filters: StatsFilters) {
    // Build query based on filters
    const whereClause: FindOptionsWhere<Match> = { brandId: userId };
    if (filters.startDate) {
      whereClause.createdAt = MoreThanOrEqual(new Date(filters.startDate));
    }
    // Add more filters as needed (endDate, category, etc.)

    const matches = await this.matchRepository.find({
      where: whereClause,
      relations: ['influencer'], // Load influencer details if needed for campaign stats
    });

    // Messages might not be the best source for daily stats unless messages trigger stat updates
    // Consider a separate stats logging mechanism or derive from Match updates
    // const messages = await this.messageRepository.find({
    //   where: { senderId: userId }, // This might not be correct for brand stats
    //   order: { createdAt: 'ASC' },
    // });

    // Calculate statistics from matches
    const totalClicks = matches.reduce((sum, match) => sum + (match.stats?.clicks || 0), 0);
    const totalImpressions = matches.reduce((sum, match) => sum + (match.stats?.impressions || 0), 0);
    const engagementRates = matches.map(m => m.stats?.engagementRate || 0).filter(rate => rate > 0);
    const averageEngagementRate = engagementRates.length > 0
      ? engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length
      : 0;
    const totalFollowerGrowth = matches.reduce((sum, match) => sum + (match.stats?.followerGrowth || 0), 0);

    // TODO: Implement proper daily stats aggregation if needed
    const dailyStats: DailyStat[] = []; // Placeholder

    // Get campaign stats from matches
    const campaignStats = matches.map(match => ({
      id: match.id,
      name: match.name || 'N/A', // Use name from Match entity
      clicks: match.stats?.clicks || 0,
      impressions: match.stats?.impressions || 0,
      engagementRate: match.stats?.engagementRate || 0,
      followerGrowth: match.stats?.followerGrowth || 0,
      startDate: match.startDate, // Use startDate from Match entity
      endDate: match.endDate, // Use endDate from Match entity
      influencerId: match.influencerId, // Use influencerId directly
      influencerName: match.influencer?.name || 'N/A', // Get name from loaded relation
      category: match.category || 'N/A', // Use category from Match entity
    }));

    return {
      totalMatches: matches.length,
      totalClicks,
      totalImpressions,
      averageEngagementRate,
      totalFollowerGrowth,
      dailyStats, // Return placeholder
      campaignStats,
    };
  }

  async getInfluencerStats(userId: string, filters: StatsFilters) {
    // Build query based on filters
    const whereClause: FindOptionsWhere<Match> = { influencerId: userId };
     if (filters.startDate) {
      whereClause.createdAt = MoreThanOrEqual(new Date(filters.startDate));
    }
    // Add more filters as needed

    const matches = await this.matchRepository.find({
      where: whereClause,
      relations: ['brand'], // Load brand details if needed
    });

    // Messages might not be the best source for daily stats
    // const messages = await this.messageRepository.find({
    //   where: { senderId: userId }, // Correct for influencer?
    //   order: { createdAt: 'ASC' },
    // });

    // Calculate statistics from matches
    const totalClicks = matches.reduce((sum, match) => sum + (match.stats?.clicks || 0), 0);
    const totalImpressions = matches.reduce((sum, match) => sum + (match.stats?.impressions || 0), 0);
    const engagementRates = matches.map(m => m.stats?.engagementRate || 0).filter(rate => rate > 0);
    const averageEngagementRate = engagementRates.length > 0
      ? engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length
      : 0;
    const followerGrowth = matches.reduce((sum, match) => sum + (match.stats?.followerGrowth || 0), 0);

    // TODO: Implement proper daily stats aggregation if needed
    const dailyStats: DailyStat[] = []; // Placeholder

    // Get campaign stats from matches
    const campaignStats = matches.map(match => ({
      id: match.id,
      name: match.name || 'N/A',
      clicks: match.stats?.clicks || 0,
      impressions: match.stats?.impressions || 0,
      engagementRate: match.stats?.engagementRate || 0,
      followerGrowth: match.stats?.followerGrowth || 0,
      startDate: match.startDate,
      endDate: match.endDate,
      brandId: match.brandId, // Use brandId directly
      brandName: match.brand?.name || 'N/A', // Get name from loaded relation
      category: match.category || 'N/A',
    }));

    return {
      totalMatches: matches.length,
      totalClicks,
      totalImpressions,
      averageEngagementRate,
      followerGrowth,
      dailyStats,
      campaignStats,
    };
  }

  // Removed private groupDailyStats as it wasn't providing match stats
  // Consider implementing a dedicated daily stats aggregation logic if required
} 