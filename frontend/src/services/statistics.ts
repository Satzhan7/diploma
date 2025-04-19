import { BrandDashboardStats, InfluencerDashboardStats } from '../types/statistics';
import api from './api';

export const statisticsService = {
  getBrandStats: async (filters?: {
    startDate?: string;
    endDate?: string;
    influencerId?: string;
    category?: string;
  }): Promise<BrandDashboardStats> => {
    const response = await api.get('/statistics/brand', { params: filters });
    return response.data;
  },

  getInfluencerStats: async (filters?: {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    category?: string;
  }): Promise<InfluencerDashboardStats> => {
    const response = await api.get('/statistics/influencer', { params: filters });
    return response.data;
  },
}; 