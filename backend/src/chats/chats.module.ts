import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { ChatsGateway } from './chats.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '1d',
        },
      }),
      inject: [ConfigService],
    }),
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