import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Chat } from '../../chats/entities/chat.entity';

@Entity()
export class Message {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The unique identifier of the message' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Hello, how are you?', description: 'The content of the message' })
  @Column('text')
  content: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  sender: User;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The ID of the sender' })
  @Column()
  senderId: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  recipient: User;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The ID of the recipient' })
  @Column()
  recipientId: string;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The creation date of the message' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: false, description: 'Whether the message has been read' })
  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => Chat, chat => chat.messages)
  chat: Chat;

  @Column()
  chatId: string;
} 