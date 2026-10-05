import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';
import { Logger } from '@nestjs/common';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
import { TokenPayload } from '../auth/types/token-payload';
import { toChatEvent, toMessageEvent } from './chat-events';

@WebSocketGateway({
  cors: {
    // Same origin policy as the HTTP API.
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : 'http://localhost:3000',
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
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.error('No token provided');
        client.disconnect();
        return;
      }

      // JwtModule is configured with the access-token secret. The explicit
      // token type check prevents a refresh token from opening a chat socket
      // even if development uses the same JWT secret for both token classes.
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);
      if (payload.tokenType !== 'access') {
        client.disconnect();
        return;
      }
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
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ): Promise<void> {
    // Membership check: only chat participants may join
    // the room. ChatsService.findOne throws if userId is not a participant.
    const userId = this.socketUserMap.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }
    try {
      await this.chatsService.findOne(chatId, userId);
    } catch {
      this.logger.warn(`User ${userId} denied access to chat ${chatId}`);
      client.emit('error', {
        message: 'You are not a participant of this chat',
      });
      return;
    }
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
    // No WS server outside the HTTP runtime (e.g. seed script, tests).
    if (!this.server) return;

    // Explicit DTO: spreading the entity would leak sender/recipient hashes.
    this.server
      .to(`chat:${chat.id}`)
      .emit('newMessage', toMessageEvent(message, chat.id));

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
    if (!this.server) return;
    this.server.to(`chat:${chatId}`).emit('messagesRead', {
      chatId,
      userId,
    });
  }

  // Emit event when a new chat is created
  emitNewChat(chat: Chat): void {
    if (!this.server) return;
    const payload = toChatEvent(chat);
    // Emit to both participants
    this.server.to(`user:${chat.sender.id}`).emit('newChat', payload);
    this.server.to(`user:${chat.recipient.id}`).emit('newChat', payload);
  }
}
