import { User } from './user';
import { Match } from '../services/matching';
import { Application } from '../services/applications';
import { Profile } from './user';

// Use the type alias from services/orders.ts
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
  brand?: Profile;
  createdAt: string;
  updatedAt: string;
  applications?: Application[];
  match?: Match;
} 