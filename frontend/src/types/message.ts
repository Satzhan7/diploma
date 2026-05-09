import { User } from './user';

export interface Message {
  id: string;
  sender: User;
  receiver: User;
  content: string;
  createdAt: string;
  updatedAt: string;
} 