import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { ChatsGateway } from './chats.gateway';

@Injectable()
export class ChatsService {
  private chatsGateway: ChatsGateway;

  constructor(
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  // Setter injection to avoid circular dependency
  setGateway(gateway: ChatsGateway) {
    this.chatsGateway = gateway;
  }

  async findAll(userId: string): Promise<Chat[]> {
    return this.chatsRepository.find({
      where: [
        { sender: { id: userId } },
        { recipient: { id: userId } },
      ],
      relations: ['sender', 'recipient', 'messages'],
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async findOne(id: string, userId: string): Promise<Chat> {
    const chat = await this.chatsRepository.findOne({
      where: [
        { id, sender: { id: userId } },
        { id, recipient: { id: userId } },
      ],
      relations: ['sender', 'recipient', 'messages', 'messages.sender'],
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${id} not found`);
    }

    return chat;
  }

  async getMessages(chatId: string, userId: string): Promise<Message[]> {
    // First verify the user has access to this chat
    const chat = await this.findOne(chatId, userId);
    
    // Use direct SQL to get messages with all relations
    const connection = this.messagesRepository.manager.connection;
    const messageData = await connection.query(
      `SELECT m.*, 
              s.id as "senderId", s.name as "senderName", 
              r.id as "recipientId", r.name as "recipientName"
       FROM message m
       LEFT JOIN "users" s ON m."senderId" = s.id
       LEFT JOIN "users" r ON m."recipientId" = r.id
       WHERE m."chatId" = $1
       ORDER BY m."createdAt" ASC`,
      [chatId]
    );
    
    // Transform the raw SQL results into message objects
    const messages = messageData.map(row => ({
      id: row.id,
      content: row.content,
      sender: { 
        id: row.senderId,
        name: row.senderName
      },
      recipient: {
        id: row.recipientId,
        name: row.recipientName
      },
      chat: { id: chatId },
      isRead: row.isRead,
      createdAt: row.createdAt
    })) as Message[];
    
    return messages;
  }

  async create(senderId: string, recipientId: string): Promise<Chat> {
    // Check if chat already exists
    const existingChat = await this.chatsRepository.findOne({
      where: [
        { sender: { id: senderId }, recipient: { id: recipientId } },
        { sender: { id: recipientId }, recipient: { id: senderId } },
      ],
      relations: ['sender', 'recipient'],
    });

    if (existingChat) {
      return existingChat;
    }

    const chat = this.chatsRepository.create({
      sender: { id: senderId },
      recipient: { id: recipientId },
    });

    const savedChat = await this.chatsRepository.save(chat);
    
    // Fetch the complete chat with relations for the WebSocket
    const completeChat = await this.chatsRepository.findOne({
      where: { id: savedChat.id },
      relations: ['sender', 'recipient'],
    });

    // Notify connected clients about the new chat
    if (this.chatsGateway) {
      this.chatsGateway.emitNewChat(completeChat);
    }

    return completeChat;
  }

  async addMessage(chatId: string, senderId: string, content: string): Promise<Message> {
    const chat = await this.findOne(chatId, senderId);

    if (!content || content.trim() === '') {
      throw new Error('Message content cannot be empty');
    }

    const recipientId = chat.sender.id === senderId ? chat.recipient.id : chat.sender.id;

    const message = this.messagesRepository.create({
      content,
      senderId,
      recipientId,
      chatId: chatId,
      isRead: false,
    });

    const savedMessage = await this.messagesRepository.save(message);


    await this.chatsRepository.update(chatId, {
      unreadCount: chat.unreadCount + 1
    });

    const completeMessage = await this.messagesRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'recipient', 'chat'],
    });

    if (this.chatsGateway && completeMessage) {
      await this.chatsGateway.emitNewMessage(completeMessage, chat);
    }

    return completeMessage;
  }


  async markAsRead(chatId: string, userId: string): Promise<void> {
    const chat = await this.findOne(chatId, userId);

    // Only mark as read if user is the recipient
    if (chat.recipient.id === userId) {
      chat.unreadCount = 0;
      await this.chatsRepository.save(chat);

      // Mark all messages as read - use direct query instead of update with relations
      await this.messagesRepository.manager.query(
        `UPDATE message SET "isRead" = true WHERE "chatId" = $1 AND "isRead" = false`,
        [chatId]
      );

      // Notify connected clients that messages have been read
      if (this.chatsGateway) {
        this.chatsGateway.emitMessagesRead(chatId, userId);
      }
    }
    
    // Return a proper response 
    return;
  }
} 