import api from './api';
import { Application } from './applications';
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
}

export const ordersService = {
  getById: async (orderId: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  create: async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getByBrand: async (): Promise<Order[]> => {
    const response = await api.get('/orders/brand');
    return response.data;
  },

  // Edit / delete / search-by-category endpoints are not implemented on the backend.
  // They were removed from the demo build; re-add once the backend supports them.
}; 