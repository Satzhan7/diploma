import api from './api';
import { Order } from '../types/order';
import { User } from '../types/user';

export interface Application {
  id: string;
  message: string;
  proposedPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  order: Order;
  applicant?: User;
}

export const applicationsService = {
  getAll: async (): Promise<Application[]> => {
    const response = await api.get('/order-applications');
    return response.data;
  },

  getById: async (id: string): Promise<Application> => {
    const response = await api.get(`/order-applications/${id}`);
    return response.data;
  },

  create: async (
    orderId: string,
    data: { message: string; proposedPrice?: number },
  ): Promise<Application> => {
    const response = await api.post(`/order-applications/${orderId}`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<Application>): Promise<Application> => {
    const response = await api.patch(`/order-applications/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/order-applications/${id}`);
  },

  getByOrder: async (orderId: string): Promise<Application[]> => {
    const response = await api.get(`/order-applications/order/${orderId}`);
    return response.data;
  },

  getByInfluencer: async (): Promise<Application[]> => {
    const response = await api.get(`/order-applications`);
    return response.data;
  },

  getMyApplications: async (): Promise<Application[]> => {
    const response = await api.get('/order-applications');
    return response.data;
  },

  withdrawApplication: async (applicationId: string): Promise<Application> => {
    const response = await api.delete(`/order-applications/${applicationId}`);
    return response.data;
  }
}; 