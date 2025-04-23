import api from './api';

export interface Order {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  requirements: string;
  deadline: string;
  status: 'open' | 'closed' | 'in_progress';
  brand: {
    id: string;
    name: string;
    logoUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const ordersService = {
  getAll: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
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

  getByBrand: async (brandId: string): Promise<Order[]> => {
    const response = await api.get(`/orders/brand/${brandId}`);
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