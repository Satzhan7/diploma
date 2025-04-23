import api from './api';

export interface Match {
  id: string;
  brandId: string;
  influencerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
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
  async getRecommendations(userId: string, type: 'brands' | 'influencers'): Promise<Recommendation[]> {
    const response = await api.get<Recommendation[]>(
      `/matching/recommendations/${userId}?type=${type}`
    );
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
  async getMatches(userId: string): Promise<MatchScore[]> {
    const response = await api.get<MatchScore[]>(`/matching/matches/${userId}`);
    return response.data;
  }
}; 