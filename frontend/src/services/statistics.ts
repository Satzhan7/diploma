import { BrandDashboardStats, InfluencerDashboardStats } from '../types/statistics';
import api from './api';

interface StatsFilters {
  startDate?: string;
  endDate?: string;
  brandId?: string;
  influencerId?: string;
  category?: string;
}

export const statisticsService = {
  getBrandStats: async (filters: StatsFilters): Promise<BrandDashboardStats> => {
    const response = await api.get('/statistics/brand', { params: filters });
    return response.data;
  },

  getInfluencerStats: async (filters: StatsFilters): Promise<InfluencerDashboardStats> => {
    const response = await api.get('/statistics/influencer', { params: filters });
    return response.data;
  },
};
