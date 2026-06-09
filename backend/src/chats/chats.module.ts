import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { ChatsGateway } from './chats.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message]),
    // Reuse the AuthModule JwtModule (same secret/options) instead of a
    // second registration that signed with a different TTL (AUDIT §3).
    AuthModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway],
  exports: [ChatsService],
})
export class ChatsModule implements OnModuleInit {
  constructor(
    private chatsService: ChatsService,
    private chatsGateway: ChatsGateway,
  ) {}

  onModuleInit() {
    // Setup circular dependency after initialization
    this.chatsService.setGateway(this.chatsGateway);
  }
} 