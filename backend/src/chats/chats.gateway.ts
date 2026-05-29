import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';
import { Logger } from '@nestjs/common';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatsGateway.name);
  private userSocketMap = new Map<string, string>(); // userId -> socketId
  private socketUserMap = new Map<string, string>(); // socketId -> userId

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatsService: ChatsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token || 
                    client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.error('No token provided');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      if (!userId) {
        this.logger.error('Invalid token payload');
        client.disconnect();
        return;
      }

      // Store socket mapping
      this.userSocketMap.set(userId, client.id);
      this.socketUserMap.set(client.id, userId);

      // Join personal room for this user
      client.join(`user:${userId}`);
      
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error(`Socket connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = this.socketUserMap.get(client.id);
    
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ): void {
    client.join(`chat:${chatId}`);
    this.logger.log(`Socket ${client.id} joined chat room: ${chatId}`);
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ): void {
    client.leave(`chat:${chatId}`);
    this.logger.log(`Socket ${client.id} left chat room: ${chatId}`);
  }

  // Emit event when a new message is created
  async emitNewMessage(message: Message, chat: Chat): Promise<void> {
    // Ensure chat ID is available in the message
    if (message && !message.chat) {
      message.chat = { id: chat.id } as Chat;
    }

    // Emit to the specific chat room
    this.server.to(`chat:${chat.id}`).emit('newMessage', {
      ...message,
      chat: { id: chat.id }
    });
    
    // Emit to recipient's personal room
    this.server.to(`user:${message.recipient.id}`).emit('chatUpdated', {
      chatId: chat.id,
      unreadCount: chat.unreadCount,
      lastMessage: {
        content: message.content,
        timestamp: message.createdAt,
        isRead: false,
      },
    });
  }

  // Emit event when messages are marked as read
  emitMessagesRead(chatId: string, userId: string): void {
    this.server.to(`chat:${chatId}`).emit('messagesRead', {
      chatId,
      userId,
    });
  }

  // Emit event when a new chat is created
  emitNewChat(chat: Chat): void {
    // Emit to both participants
    this.server.to(`user:${chat.sender.id}`).emit('newChat', chat);
    this.server.to(`user:${chat.recipient.id}`).emit('newChat', chat);
  }
} 