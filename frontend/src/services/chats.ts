import api from './api';

export interface Chat {
  id: string;
  participant: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  isRead: boolean;
}

export const chatsService = {
  getAll: async (): Promise<Chat[]> => {
    const response = await api.get('/chats');
    return response.data;
  },

  getById: async (id: string): Promise<Chat> => {
    const response = await api.get(`/chats/${id}`);
    return response.data;
  },

  getMessages: async (chatId: string): Promise<Message[]> => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  },

  sendMessage: async (chatId: string, content: string): Promise<Message> => {
    const response = await api.post(`/chats/${chatId}/messages`, { content });
    return response.data;
  },

  markAsRead: async (chatId: string): Promise<void> => {
    await api.post(`/chats/${chatId}/read`);
  },

  createChat: async (participantId: string): Promise<Chat> => {
    const response = await api.post(`/chats/${participantId}`);
    return response.data;
  },
}; 