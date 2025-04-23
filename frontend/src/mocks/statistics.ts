import { CampaignStats } from '../types/statistics';
import { mockOrders } from './orders';
import {Order} from "../types/order";

export const mockCampaignStats: ({
  engagementRate: number;
  createdAt: string;
  followerGrowth: number;
  clicks: number;
  id: string;
  impressions: number;
  order: Order;
  updatedAt: string
} | {
  engagementRate: number;
  createdAt: string;
  followerGrowth: number;
  clicks: number;
  id: string;
  impressions: number;
  order: Order;
  updatedAt: string
} | {
  engagementRate: number;
  createdAt: string;
  followerGrowth: number;
  clicks: number;
  id: string;
  impressions: number;
  order: Order;
  updatedAt: string
} | {
  engagementRate: number;
  createdAt: string;
  followerGrowth: number;
  clicks: number;
  id: string;
  impressions: number;
  order: Order;
  updatedAt: string
})[] = [
  {
    id: '1',
    order: mockOrders[0],
    clicks: 15000,
    impressions: 50000,
    engagementRate: 4.5,
    followerGrowth: 1200,
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15'
  },
  {
    id: '2',
    order: mockOrders[1],
    clicks: 25000,
    impressions: 75000,
    engagementRate: 5.2,
    followerGrowth: 2000,
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10'
  },
  {
    id: '3',
    order: mockOrders[2],
    clicks: 18000,
    impressions: 60000,
    engagementRate: 4.8,
    followerGrowth: 1500,
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05'
  },
  {
    id: '4',
    order: mockOrders[4],
    clicks: 12000,
    impressions: 40000,
    engagementRate: 3.9,
    followerGrowth: 800,
    createdAt: '2024-02-15',
    updatedAt: '2024-03-01'
  }
]; 