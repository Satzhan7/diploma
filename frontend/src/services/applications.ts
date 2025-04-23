import api from './api';
import { Order } from './orders';

export interface Application {
  id: string;
  message: string;
  proposedPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  order: Order;
  applicant?: { id: string; name: string; avatarUrl?: string };
}

export const applicationsService = {
  getAll: async (): Promise<Application[]> => {
    const response = await api.get('/applications');
    return response.data;
  },

  getById: async (id: string): Promise<Application> => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  create: async (data: Omit<Application, 'id' | 'createdAt' | 'status'>): Promise<Application> => {
    const response = await api.post('/applications', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Application>): Promise<Application> => {
    const response = await api.put(`/applications/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/applications/${id}`);
  },

  getByOrder: async (orderId: string): Promise<Application[]> => {
    const response = await api.get(`/applications/order/${orderId}`);
    return response.data;
  },

  getByInfluencer: async (influencerId: string): Promise<Application[]> => {
    const response = await api.get(`/applications/influencer/${influencerId}`);
    return response.data;
  },

  getByStatus: async (status: Application['status']): Promise<Application[]> => {
    const response = await api.get(`/applications/status/${status}`);
    return response.data;
  },

  getMyApplications: async (): Promise<Application[]> => {
    const response = await api.get('/applications/my');
    return response.data;
  },

  withdrawApplication: async (applicationId: string): Promise<Application> => {
    const response = await api.patch(`/applications/${applicationId}/withdraw`);
    return response.data;
  }
}; 