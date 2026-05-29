import api from './api';

// Add a basic User type
interface BasicUser {
  id: string;
  name: string;
  // Add other relevant user fields if needed, e.g., avatarUrl
  profile?: {
    avatarUrl?: string;
  };
}

export interface Match {
  id: string;
  brandId: string;
  influencerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
  // Add optional brand and influencer objects
  brand?: BasicUser;
  influencer?: BasicUser;
  stats?: {
    clicks?: number;
    impressions?: number;
    engagementRate?: number;
    followerGrowth?: number;
  };
}

export interface MatchRecommendation {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  followers?: number;
  categories?: string[];
  matchScore: {
    categoryMatch: number;
    audienceFit?: number;
    brandFit?: number;
    overallScore: number;
  };
}

export interface UpdateMatchStatsDto {
  clicks?: number;
  impressions?: number;
  engagementRate?: number;
  followerGrowth?: number;
}

export interface MatchScore {
  brandId: string;
  influencerId: string;
  score: number;
  categories: string[];
  engagementRate: number;
  followers: number;
}

export interface Recommendation {
  id: string;
  matchScore: number;
  user: {
    id: string;
    name: string;
    bio: string;
    categories: string[];
    engagementRate: number;
    followers: number;
  };
}

export const matchingService = {
  // Получить все матчи пользователя
  getUserMatches: async (): Promise<Match[]> => {
    const response = await api.get('/matching/user/matches');
    return response.data;
  },

  // Получить один матч по ID
  getMatchById: async (id: string): Promise<Match> => {
    const response = await api.get(`/matching/${id}`);
    return response.data;
  },

  // Создать новый матч
  createMatch: async (data: any): Promise<Match> => {
    const response = await api.post('/matching', data);
    return response.data;
  },

  // Обновить матч
  updateMatch: async (id: string, data: any): Promise<Match> => {
    const response = await api.put(`/matching/${id}`, data);
    return response.data;
  },

  // Обновить статистику матча
  updateMatchStats: async (id: string, stats: UpdateMatchStatsDto): Promise<Match> => {
    const response = await api.patch(`/matching/${id}/stats`, stats);
    return response.data;
  },

  // Завершить матч
  completeMatch: async (id: string): Promise<Match> => {
    const response = await api.patch(`/matching/${id}/complete`);
    return response.data;
  },

  // Получить рекомендации
  async getRecommendations(type: 'brands' | 'influencers', limit: number = 10): Promise<Recommendation[]> {
    const endpoint = type === 'brands' ? '/matching/recommendations/brands' : '/matching/recommendations/influencers';
    const response = await api.get<Recommendation[]>(endpoint, { params: { limit } });
    return response.data.sort((a: Recommendation, b: Recommendation) => b.matchScore - a.matchScore);
  },

  // Рассчитать совместимость
  async calculateMatch(brandId: string, influencerId: string): Promise<MatchScore> {
    const response = await api.post<MatchScore>('/matching/calculate', {
      brandId,
      influencerId
    });
    return response.data;
  },

  // Принять матч
  async acceptMatch(matchId: string): Promise<void> {
    await api.post(`/matching/${matchId}/accept`);
  },

  // Отклонить матч
  async rejectMatch(matchId: string): Promise<void> {
    await api.post(`/matching/${matchId}/reject`);
  },

  // Получить матчи пользователя
  async getMatches(): Promise<MatchScore[]> {
    const response = await api.get<MatchScore[]>('/matching/user/matches');
    return response.data;
  }
}; 