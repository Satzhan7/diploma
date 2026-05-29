import api from './api';
import { MatchStatus } from '../types/match';

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

export const matchService = {
  // Получить все матчи для текущего пользователя
  getUserMatches: async (): Promise<Match[]> => {
    const response = await api.get('/matching/user/matches');
    return response.data;
  },

  // Получить матч по ID
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

  // Обновить статистику матча (клики, показы и т.д.)
  updateMatchStats: async (id: string, stats: UpdateMatchStatsDto): Promise<Match> => {
    const response = await api.patch(`/matching/${id}/stats`, stats);
    return response.data;
  },

  // Пометить матч как завершенный
  completeMatch: async (id: string): Promise<Match> => {
    const response = await api.patch(`/matching/${id}/complete`);
    return response.data;
  },

  // Принять приглашение о сотрудничестве
  acceptMatch: async (id: string): Promise<Match> => {
    const response = await api.put(`/matching/${id}`, { status: 'accepted' });
    return response.data;
  },

  // Отклонить приглашение о сотрудничестве
  rejectMatch: async (id: string): Promise<Match> => {
    const response = await api.put(`/matching/${id}`, { status: 'rejected' });
    return response.data;
  }
}; 