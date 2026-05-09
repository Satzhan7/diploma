import { Order } from './order';

export interface DailyStat {
  date: string;
  clicks: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
}

export interface CampaignStat {
  id: string;
  name: string;
  clicks?: number;
  impressions?: number;
  engagementRate?: number;
  followerGrowth?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: string;
  influencerId?: string;
  influencerName?: string;
  brandId?: string;
  brandName?: string;
  category?: string;
}

export interface BrandDashboardStats {
  totalOrdersCreated: number;
  openOrders: number;
  inProgressOrders: number;
  totalApplicationsReceived: number;
  pendingApplications: number;
  acceptedApplications: number;
  totalMatches: number;
  completedMatches: number;
  totalClicks: number;
  totalImpressions: number;
  averageEngagementRate: number;
  dailyStats: DailyStat[];
  campaignStats: CampaignStat[];
}

export interface InfluencerDashboardStats {
  totalApplicationsSent: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  withdrawnApplications: number;
  totalMatches: number;
  completedMatches: number;
  totalClicks: number;
  totalImpressions: number;
  averageEngagementRate: number;
  followerGrowth: number;
  dailyStats: DailyStat[];
  campaignStats: CampaignStat[];
} 