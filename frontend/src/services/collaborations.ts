import api from './api';

export interface Collaboration {
  id: string;
  brandId: string;
  influencerId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  budget: number;
  description: string;
  requirements: string;
  deliverables: string[];
  createdAt: string;
  updatedAt: string;
}

export const collaborationsService = {
  getAll: async (): Promise<Collaboration[]> => {
    const response = await api.get('/collaborations');
    return response.data;
  },

  getById: async (id: string): Promise<Collaboration> => {
    const response = await api.get(`/collaborations/${id}`);
    return response.data;
  },

  create: async (data: Omit<Collaboration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collaboration> => {
    const response = await api.post('/collaborations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Collaboration>): Promise<Collaboration> => {
    const response = await api.put(`/collaborations/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/collaborations/${id}`);
  },

  getByBrand: async (brandId: string): Promise<Collaboration[]> => {
    const response = await api.get(`/collaborations/brand/${brandId}`);
    return response.data;
  },

  getByInfluencer: async (influencerId: string): Promise<Collaboration[]> => {
    const response = await api.get(`/collaborations/influencer/${influencerId}`);
    return response.data;
  },

  getByStatus: async (status: Collaboration['status']): Promise<Collaboration[]> => {
    const response = await api.get(`/collaborations/status/${status}`);
    return response.data;
  },

  updateProgress: async (id: string, progress: number): Promise<Collaboration> => {
    const response = await api.put(`/collaborations/${id}/progress`, { progress });
    return response.data;
  }
}; 