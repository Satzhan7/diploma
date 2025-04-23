import api from './api';
import { User } from '../types/user';

export type { User };

export enum UserRole {
  ADMIN = 'admin',
  BRAND = 'brand',
  INFLUENCER = 'influencer',
}

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timezone: string;
}

interface UserFilter {
  category?: string;
  searchQuery?: string;
}

export const usersService = {
  // User methods
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Settings methods
  getSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/users/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put('/users/settings', settings);
    return response.data;
  },

  resetSettings: async (): Promise<UserSettings> => {
    const response = await api.post('/users/settings/reset');
    return response.data;
  },

  // Influencer methods
  getAllInfluencers: async (): Promise<User[]> => {
    const response = await api.get('/users/influencers');
    return response.data;
  },

  getInfluencerById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/influencers/${id}`);
    return response.data;
  },

  getInfluencersByCategory: async (category: string): Promise<User[]> => {
    const response = await api.get(`/users/influencers/category/${category}`);
    return response.data;
  },

  searchInfluencers: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/influencers/search?q=${query}`);
    return response.data;
  },

  // Brand methods
  getAllBrands: async (): Promise<User[]> => {
    const response = await api.get('/users/brands');
    return response.data;
  },

  getBrandById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/brands/${id}`);
    return response.data;
  },

  getBrandsByCategory: async (category: string): Promise<User[]> => {
    const response = await api.get(`/users/brands?category=${category}`);
    return response.data;
  },

  getBrandsByIndustry: async (industry: string): Promise<User[]> => {
    const response = await api.get(`/users/brands?industry=${industry}`);
    return response.data;
  },

  searchBrands: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/brands/search?q=${query}`);
    return response.data;
  },

  // Recommendation methods
  getRecommendedBrands: async (): Promise<User[]> => {
    const response = await api.get('/users/brands/recommended');
    return response.data;
  },

  // Profile update
  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  }
}; 