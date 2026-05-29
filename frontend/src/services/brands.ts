import api from './api';

export interface Brand {
  id: string;
  name: string;
  avatarUrl: string;
  description: string;
  industry: string;
  location: string;
  activeOrders: number;
  totalSpent: number;
}

export const brandsService = {
  getAll: async (): Promise<Brand[]> => {
    const response = await api.get('/brands');
    return response.data;
  },

  getById: async (id: string): Promise<Brand> => {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },

  getByIndustry: async (industry: string): Promise<Brand[]> => {
    const response = await api.get(`/brands/industry/${industry}`);
    return response.data;
  },

  search: async (query: string): Promise<Brand[]> => {
    const response = await api.get(`/brands/search?q=${query}`);
    return response.data;
  }
}; 