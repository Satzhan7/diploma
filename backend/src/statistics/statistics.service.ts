import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../matching/entities/match.entity';
import { Message } from '../messages/entities/message.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';

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
    const matches = await this.matchRepository.find({
      where: { brand: { user: { id: userId } } },
      relations: ['influencer', 'influencer.user', 'brand', 'brand.user'],
    });

    const messages = await this.messageRepository.find({
      where: { senderId: userId },
      order: { createdAt: 'ASC' },
    });

    // Calculate statistics
    const totalClicks = matches.reduce((sum, match) => sum + (match.clicks || 0), 0);
    const totalImpressions = matches.reduce((sum, match) => sum + (match.impressions || 0), 0);
    const averageEngagementRate = matches.length > 0
      ? matches.reduce((sum, match) => sum + (match.engagementRate || 0), 0) / matches.length
      : 0;
    const totalFollowerGrowth = matches.reduce((sum, match) => sum + (match.followerGrowth || 0), 0);

    // Group daily stats
    const dailyStats = this.groupDailyStats(messages);

    // Get campaign stats
    const campaignStats = matches.map(match => ({
      id: match.id,
      name: match.name,
      clicks: match.clicks || 0,
      impressions: match.impressions || 0,
      engagementRate: match.engagementRate || 0,
      followerGrowth: match.followerGrowth || 0,
      startDate: match.startDate,
      endDate: match.endDate,
      influencerId: match.influencer.user.id,
      influencerName: match.influencer.user.name,
      category: match.category,
    }));

    return {
      totalClicks,
      totalImpressions,
      averageEngagementRate,
      totalFollowerGrowth,
      dailyStats,
      campaignStats,
    };
  }

  async getInfluencerStats(userId: string, filters: StatsFilters) {
    const matches = await this.matchRepository.find({
      where: { influencer: { user: { id: userId } } },
      relations: ['influencer', 'influencer.user', 'brand', 'brand.user'],
    });

    const messages = await this.messageRepository.find({
      where: { senderId: userId },
      order: { createdAt: 'ASC' },
    });

    // Calculate statistics
    const totalClicks = matches.reduce((sum, match) => sum + (match.clicks || 0), 0);
    const totalImpressions = matches.reduce((sum, match) => sum + (match.impressions || 0), 0);
    const averageEngagementRate = matches.length > 0
      ? matches.reduce((sum, match) => sum + (match.engagementRate || 0), 0) / matches.length
      : 0;
    const followerGrowth = matches.reduce((sum, match) => sum + (match.followerGrowth || 0), 0);

    // Group daily stats
    const dailyStats = this.groupDailyStats(messages);

    // Get campaign stats
    const campaignStats = matches.map(match => ({
      id: match.id,
      name: match.name,
      clicks: match.clicks || 0,
      impressions: match.impressions || 0,
      engagementRate: match.engagementRate || 0,
      followerGrowth: match.followerGrowth || 0,
      startDate: match.startDate,
      endDate: match.endDate,
      brandId: match.brand.user.id,
      brandName: match.brand.user.name,
      category: match.category,
    }));

    return {
      totalClicks,
      totalImpressions,
      averageEngagementRate,
      followerGrowth,
      dailyStats,
      campaignStats,
    };
  }

  private groupDailyStats(messages: Message[]) {
    const statsByDate = new Map<string, {
      date: string;
      clicks: number;
      impressions: number;
      engagementRate: number;
      followerGrowth: number;
    }>();

    messages.forEach(message => {
      const date = message.createdAt.toISOString().split('T')[0];
      if (!statsByDate.has(date)) {
        statsByDate.set(date, {
          date,
          clicks: 0,
          impressions: 0,
          engagementRate: 0,
          followerGrowth: 0,
        });
      }
      // Add message-specific stats here if needed
    });

    return Array.from(statsByDate.values());
  }
} 