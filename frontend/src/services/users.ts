import api from './api';
import { User } from '../types/user';

export type { User };

export enum UserRole {
  ADMIN = 'admin',
  BRAND = 'brand',
  INFLUENCER = 'influencer',
}

export const usersService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getAllInfluencers: async (search?: string, category?: string): Promise<User[]> => {
    const response = await api.get('/users/influencers', { params: { search, category } });
    return response.data;
  },

  getInfluencersByCategory: async (category: string): Promise<User[]> => {
    const response = await api.get('/users/influencers', { params: { category } });
    return response.data;
  },

  searchInfluencers: async (query: string): Promise<User[]> => {
    const response = await api.get('/users/influencers', { params: { search: query } });
    return response.data;
  },

  getAllBrands: async (search?: string): Promise<User[]> => {
    const response = await api.get('/users/brands', { params: { search } });
    return response.data;
  },

  getBrandsByIndustry: async (industry: string): Promise<User[]> => {
    // Backend has no dedicated industry filter on /users/brands; fall back to text search.
    const response = await api.get('/users/brands', { params: { search: industry } });
    return response.data;
  },

  searchBrands: async (query: string): Promise<User[]> => {
    const response = await api.get('/users/brands', { params: { search: query } });
    return response.data;
  },

  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
}; 