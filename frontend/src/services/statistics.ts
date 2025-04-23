// import api from './api';
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

// Генерация моковых данных
function generateDailyStats(days: number) {
  const stats = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    stats.push({
      date: date.toISOString().split('T')[0],
      clicks: Math.floor(Math.random() * 1000) + 100,
      impressions: Math.floor(Math.random() * 10000) + 1000,
      engagementRate: (Math.random() * 5) + 1,
      followerGrowth: Math.floor(Math.random() * 100),
    });
  }
  
  return stats.reverse();
}

function generateCampaignStats(count: number) {
  const categories = ['Fashion', 'Beauty', 'Technology', 'Fitness', 'Food', 'Travel', 'Lifestyle'];
  const campaigns = [];
  
  for (let i = 0; i < count; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30) + 10);
    
    campaigns.push({
      id: `camp-${i + 1}`,
      name: `Campaign ${i + 1}`,
      clicks: Math.floor(Math.random() * 5000) + 500,
      impressions: Math.floor(Math.random() * 50000) + 5000,
      engagementRate: (Math.random() * 5) + 1,
      followerGrowth: Math.floor(Math.random() * 500),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: ['active', 'completed', 'pending'][Math.floor(Math.random() * 3)],
      budget: Math.floor(Math.random() * 10000) + 1000,
      influencerId: `infl-${i + 1}`,
      influencerName: `Influencer ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
    });
  }
  
  return campaigns;
} 