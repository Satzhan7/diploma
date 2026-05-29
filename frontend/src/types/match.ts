export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export interface Match {
  id: string;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
  engagementRate: number;
  followerGrowth: number;
  status: MatchStatus;
  brand: any;
  influencer: any;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMatchStatsDto {
  clicks?: number;
  impressions?: number;
  engagementRate?: number;
  followerGrowth?: number;
} 