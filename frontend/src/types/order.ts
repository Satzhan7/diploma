import { User } from './user';

export enum OrderStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface OrderApplication {
  id: string;
  message: string;
  proposedPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  applicant: User;
}

export interface Order {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  requirements: string;
  deadline: string;
  status: OrderStatus;
  brand: User;
  applications: OrderApplication[];
  createdAt: string;
  updatedAt: string;
} 