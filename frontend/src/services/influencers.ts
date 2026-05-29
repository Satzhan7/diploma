import api from './api';

export interface Influencer {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  engagementRate: number;
  categories: string[];
  languages: string[];
}

export const influencersService = {
  getAll: async (): Promise<Influencer[]> => {
    const response = await api.get('/influencers');
    return response.data;
  },

  getById: async (id: string): Promise<Influencer> => {
    const response = await api.get(`/influencers/${id}`);
    return response.data;
  },

  getByCategory: async (category: string): Promise<Influencer[]> => {
    const response = await api.get(`/influencers/category/${category}`);
    return response.data;
  },

  getByLanguage: async (language: string): Promise<Influencer[]> => {
    const response = await api.get(`/influencers/language/${language}`);
    return response.data;
  },

  search: async (query: string): Promise<Influencer[]> => {
    const response = await api.get(`/influencers/search?q=${query}`);
    return response.data;
  }
}; 