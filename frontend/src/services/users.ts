import api from './api';
import { User } from '../types/user';

export type { User };

export enum UserRole {
  ADMIN = 'admin',
  BRAND = 'brand',
  INFLUENCER = 'influencer',
}

export const usersService = {
  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
}; 