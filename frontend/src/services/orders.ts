import api from './api';
import { User } from './users';
import { Application } from './applications';
import { Match } from './matching';
import { Profile } from '../types/user';

export type OrderStatus = 'open' | 'closed' | 'in_progress' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  requirements?: string;
  deadline?: string;
  status: OrderStatus;
  brandId: string;
  createdAt: string;
  updatedAt: string;
  brand?: Profile;
  applications?: Application[];
  match?: Match;
}

export const ordersService = {
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data;
  },

  getById: async (orderId: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  create: async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Order>): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  getByBrand: async (): Promise<Order[]> => {
    const response = await api.get(`/orders/brand`);
    return response.data;
  },

  getByCategory: async (category: string): Promise<Order[]> => {
    const response = await api.get(`/orders/category/${category}`);
    return response.data;
  },

  search: async (query: string): Promise<Order[]> => {
    const response = await api.get(`/orders/search?q=${query}`);
    return response.data;
  }
}; 