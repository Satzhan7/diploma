import { Order } from './order';

export interface DailyStats {
  date: string;
  clicks: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
}

export interface CampaignStats {
  id: string;
  order: Order;
  name: string;
  category: string;
  status: string;
  clicks: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
  startDate: string;
  endDate: string;
  influencerId?: string;
  influencerName?: string;
  brandId?: string;
  brandName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDashboardStats {
  totalClicks: number;
  totalImpressions: number;
  averageEngagementRate: number;
  totalFollowerGrowth: number;
  activeCampaigns?: number;
  totalReach?: number;
  reachChange?: number;
  engagementRate?: number;
  engagementChange?: number;
  clicksChange?: number;
  impressionsChange?: number;
  connectedInfluencers?: number;
  dailyStats: DailyStats[];
  campaignStats: CampaignStats[];
}

export interface InfluencerDashboardStats {
  totalClicks: number;
  totalImpressions: number;
  averageEngagementRate: number;
  followerGrowth: number;
  clicksChange?: number;
  impressionsChange?: number;
  engagementChange?: number;
  followerGrowthChange?: number;
  dailyStats: DailyStats[];
  campaignStats: CampaignStats[];
} 