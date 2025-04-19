import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async findAll(): Promise<Message[]> {
    return this.messageRepository.find();
  }

  async findOne(id: string): Promise<Message> {
    return this.messageRepository.findOne({ where: { id } });
  }

  async create(message: Partial<Message>): Promise<Message> {
    const newMessage = this.messageRepository.create(message);
    return this.messageRepository.save(newMessage);
  }

  async update(id: string, message: Partial<Message>): Promise<Message> {
    await this.messageRepository.update(id, message);
    return this.messageRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.messageRepository.delete(id);
  }

  async findConversationBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: [
        { senderId: userId1, recipientId: userId2 },
        { senderId: userId2, recipientId: userId1 },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async createConversation(senderId: string, data: { recipientId: string; initialMessage: string }): Promise<Message> {
    const message = this.messageRepository.create({
      senderId,
      recipientId: data.recipientId,
      content: data.initialMessage,
      isRead: false,
    });

    return this.messageRepository.save(message);
  }
} 