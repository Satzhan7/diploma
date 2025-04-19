export interface CampaignStats {
  id: string;
  name: string;
  clicks: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
  startDate: string;
  endDate: string;
  status: string;
  budget: number;
  influencerId: string;
  influencerName: string;
  category: string;
}

export interface DailyStats {
  date: string;
  clicks: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
}

export interface BrandDashboardStats {
  totalClicks: number;
  totalImpressions: number;
  averageEngagementRate: number;
  totalFollowerGrowth: number;
  activeCampaigns: number;
  totalReach: number;
  reachChange: number;
  engagementRate: number;
  engagementChange: number;
  connectedInfluencers: number;
  dailyStats: DailyStats[];
  campaignStats: CampaignStats[];
}

export interface InfluencerDashboardStats {
  totalClicks: number;
  totalImpressions: number;
  averageEngagementRate: number;
  followerGrowth: number;
  dailyStats: DailyStats[];
  campaignStats: CampaignStats[];
} 