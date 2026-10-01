import { User } from '../users/entities/user.entity';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';

// Socket.IO serialises payloads with plain JSON, so class-transformer
// @Exclude on User.password/refreshToken never runs. Every WebSocket payload
// must be built from these explicit allow-lists, never by spreading entities.

export interface ChatUserEvent {
  id: string;
  name: string;
  role: User['role'];
}

export interface MessageEvent {
  id: string;
  content: string;
  chat: { id: string };
  sender: ChatUserEvent;
  recipient: ChatUserEvent;
  isRead: boolean;
  createdAt: Date;
}

export interface ChatEvent {
  id: string;
  sender: ChatUserEvent;
  recipient: ChatUserEvent;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toChatUserEvent(user: User): ChatUserEvent {
  return { id: user.id, name: user.name, role: user.role };
}

export function toMessageEvent(message: Message, chatId: string): MessageEvent {
  return {
    id: message.id,
    content: message.content,
    chat: { id: chatId },
    sender: toChatUserEvent(message.sender),
    recipient: toChatUserEvent(message.recipient),
    isRead: message.isRead,
    createdAt: message.createdAt,
  };
}

export function toChatEvent(chat: Chat): ChatEvent {
  return {
    id: chat.id,
    sender: toChatUserEvent(chat.sender),
    recipient: toChatUserEvent(chat.recipient),
    unreadCount: chat.unreadCount,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

export interface PublicChatMessage {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: Date;
  sender?: ChatUserEvent;
}

export type PublicChat = ChatEvent & { messages?: PublicChatMessage[] };

// HTTP chat responses use the same user allow-list as the socket events.
export function toPublicChat(chat: Chat): PublicChat {
  const publicChat: PublicChat = toChatEvent(chat);
  if (chat.messages) {
    publicChat.messages = chat.messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      recipientId: message.recipientId,
      isRead: message.isRead,
      createdAt: message.createdAt,
      ...(message.sender ? { sender: toChatUserEvent(message.sender) } : {}),
    }));
  }
  return publicChat;
}
