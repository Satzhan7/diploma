import { User } from './user'; // Assuming User type is in user.ts

// Based on usage in Messages.tsx
export interface Message {
  id: string;
  content: string;
  sender: User | { id: string };
  recipient: User | { id: string };
  chat: { id: string } | string;
  createdAt: string; 
  timestamp?: string; // Optional based on usage
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  sender: User; // Added based on Messages.tsx usage
  recipient: User; // Added based on Messages.tsx usage
  lastMessage?: {
    content: string;
    timestamp: string; // Assuming string based on usage
    isRead: boolean;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
} 