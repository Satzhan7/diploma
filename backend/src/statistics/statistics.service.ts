import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Match, MatchStatus } from '../matching/entities/match.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderApplication, ApplicationStatus } from '../orders/entities/order-application.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { DailyStat } from './dto/daily-stat.dto';

interface StatsFilters {
  startDate?: string;
  endDate?: string;
  influencerId?: string;
  brandId?: string;
  category?: string;
}

const safeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderApplication)
    private readonly applicationRepository: Repository<OrderApplication>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // --- Brand dashboard ---------------------------------------------------

  async getBrandStats(userId: string, filters: StatsFilters) {
    const dateRange = this.buildDateRange(filters);

    const brandProfile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    // Orders owned by the brand (Order.brand FK points at the brand Profile).
    const orderWhere: FindOptionsWhere<Order> = brandProfile
      ? { brandId: brandProfile.id }
      : { brandId: 'unknown-brand-profile' }; // returns []
    if (dateRange.from) {
      orderWhere.createdAt = MoreThanOrEqual(dateRange.from);
    }
    if (dateRange.to) {
      orderWhere.createdAt = LessThanOrEqual(dateRange.to);
    }
    if (filters.category) {
      orderWhere.category = filters.category;
    }

    const orders = brandProfile
      ? await this.orderRepository.find({
          where: orderWhere,
          relations: ['applications'],
          order: { createdAt: 'DESC' },
        })
      : [];

    const totalOrdersCreated = orders.length;
    const openOrders = orders.filter((o) => o.status === OrderStatus.OPEN).length;
    const inProgressOrders = orders.filter((o) => o.status === OrderStatus.IN_PROGRESS).length;

    const allApplications = orders.flatMap((o) => o.applications ?? []);
    const totalApplicationsReceived = allApplications.length;
    const pendingApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.PENDING,
    ).length;
    const acceptedApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.ACCEPTED,
    ).length;

    // Matches the brand User is a party to.
    const matchWhere: FindOptionsWhere<Match> = { brandId: userId };
    if (dateRange.from) matchWhere.createdAt = MoreThanOrEqual(dateRange.from);
    if (dateRange.to) matchWhere.createdAt = LessThanOrEqual(dateRange.to);
    if (filters.influencerId) matchWhere.influencerId = filters.influencerId;
    if (filters.category) matchWhere.category = filters.category;

    const matches = await this.matchRepository.find({
      where: matchWhere,
      relations: ['influencer'],
    });

    const totalMatches = matches.length;
    const completedMatches = matches.filter((m) => m.status === MatchStatus.COMPLETED).length;

    const { totalClicks, totalImpressions, averageEngagementRate } = this.aggregateMatchKpis(matches);

    return {
      totalOrdersCreated: safeNumber(totalOrdersCreated),
      openOrders: safeNumber(openOrders),
      inProgressOrders: safeNumber(inProgressOrders),
      totalApplicationsReceived: safeNumber(totalApplicationsReceived),
      pendingApplications: safeNumber(pendingApplications),
      acceptedApplications: safeNumber(acceptedApplications),
      totalMatches: safeNumber(totalMatches),
      completedMatches: safeNumber(completedMatches),
      totalClicks: safeNumber(totalClicks),
      totalImpressions: safeNumber(totalImpressions),
      averageEngagementRate: safeNumber(averageEngagementRate),
      // Daily time-series aggregation is a documented future improvement.
      dailyStats: [] as DailyStat[],
      campaignStats: matches.map((match) => ({
        id: match.id,
        name: match.name || 'Campaign',
        clicks: safeNumber(match.stats?.clicks),
        impressions: safeNumber(match.stats?.impressions),
        engagementRate: safeNumber(match.stats?.engagementRate),
        followerGrowth: safeNumber(match.stats?.followerGrowth),
        startDate: match.startDate,
        endDate: match.endDate,
        status: match.status,
        influencerId: match.influencerId,
        influencerName: match.influencer?.name || 'N/A',
        category: match.category || 'N/A',
      })),
    };
  }

  // --- Influencer dashboard ---------------------------------------------

  async getInfluencerStats(userId: string, filters: StatsFilters) {
    const dateRange = this.buildDateRange(filters);

    const applicationWhere: FindOptionsWhere<OrderApplication> = {
      applicant: { id: userId },
    };
    if (dateRange.from) applicationWhere.createdAt = MoreThanOrEqual(dateRange.from);
    if (dateRange.to) applicationWhere.createdAt = LessThanOrEqual(dateRange.to);

    const applications = await this.applicationRepository.find({
      where: applicationWhere,
    });

    const totalApplicationsSent = applications.length;
    const pendingApplications = applications.filter(
      (a) => a.status === ApplicationStatus.PENDING,
    ).length;
    const acceptedApplications = applications.filter(
      (a) => a.status === ApplicationStatus.ACCEPTED,
    ).length;
    const rejectedApplications = applications.filter(
      (a) => a.status === ApplicationStatus.REJECTED,
    ).length;
    const withdrawnApplications = applications.filter(
      (a) => a.status === ApplicationStatus.WITHDRAWN,
    ).length;

    const matchWhere: FindOptionsWhere<Match> = { influencerId: userId };
    if (dateRange.from) matchWhere.createdAt = MoreThanOrEqual(dateRange.from);
    if (dateRange.to) matchWhere.createdAt = LessThanOrEqual(dateRange.to);
    if (filters.brandId) matchWhere.brandId = filters.brandId;
    if (filters.category) matchWhere.category = filters.category;

    const matches = await this.matchRepository.find({
      where: matchWhere,
      relations: ['brand'],
    });

    const totalMatches = matches.length;
    const completedMatches = matches.filter((m) => m.status === MatchStatus.COMPLETED).length;

    const { totalClicks, totalImpressions, averageEngagementRate, followerGrowth } =
      this.aggregateMatchKpis(matches);

    return {
      totalApplicationsSent: safeNumber(totalApplicationsSent),
      pendingApplications: safeNumber(pendingApplications),
      acceptedApplications: safeNumber(acceptedApplications),
      rejectedApplications: safeNumber(rejectedApplications),
      withdrawnApplications: safeNumber(withdrawnApplications),
      totalMatches: safeNumber(totalMatches),
      completedMatches: safeNumber(completedMatches),
      totalClicks: safeNumber(totalClicks),
      totalImpressions: safeNumber(totalImpressions),
      averageEngagementRate: safeNumber(averageEngagementRate),
      followerGrowth: safeNumber(followerGrowth),
      // Daily time-series aggregation is a documented future improvement.
      dailyStats: [] as DailyStat[],
      campaignStats: matches.map((match) => ({
        id: match.id,
        name: match.name || 'Campaign',
        clicks: safeNumber(match.stats?.clicks),
        impressions: safeNumber(match.stats?.impressions),
        engagementRate: safeNumber(match.stats?.engagementRate),
        followerGrowth: safeNumber(match.stats?.followerGrowth),
        startDate: match.startDate,
        endDate: match.endDate,
        status: match.status,
        brandId: match.brandId,
        brandName: match.brand?.name || 'N/A',
        category: match.category || 'N/A',
      })),
    };
  }

  // --- Helpers ----------------------------------------------------------

  private buildDateRange(filters: StatsFilters): { from?: Date; to?: Date } {
    const range: { from?: Date; to?: Date } = {};
    if (filters.startDate) {
      const from = new Date(filters.startDate);
      if (!Number.isNaN(from.getTime())) range.from = from;
    }
    if (filters.endDate) {
      const to = new Date(filters.endDate);
      if (!Number.isNaN(to.getTime())) range.to = to;
    }
    return range;
  }

  private aggregateMatchKpis(matches: Match[]) {
    const totalClicks = matches.reduce(
      (sum, match) => sum + safeNumber(match.stats?.clicks),
      0,
    );
    const totalImpressions = matches.reduce(
      (sum, match) => sum + safeNumber(match.stats?.impressions),
      0,
    );
    const followerGrowth = matches.reduce(
      (sum, match) => sum + safeNumber(match.stats?.followerGrowth),
      0,
    );
    const engagementRates = matches
      .map((m) => safeNumber(m.stats?.engagementRate))
      .filter((rate) => rate > 0);
    const averageEngagementRate =
      engagementRates.length > 0
        ? engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length
        : 0;

    return { totalClicks, totalImpressions, followerGrowth, averageEngagementRate };
  }
}
