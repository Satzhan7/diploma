import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ProfilesModule } from './profiles/profiles.module';
import { MessagesModule } from './messages/messages.module';
import { MatchingModule } from './matching/matching.module';
import { OrdersModule } from './orders/orders.module';
import { ChatsModule } from './chats/chats.module';
import { User } from './users/entities/user.entity';
import { Chat } from './chats/entities/chat.entity';
import { Message as ChatMessage } from './chats/entities/message.entity';
import { Message } from './messages/entities/message.entity';
import { Profile } from './profiles/entities/profile.entity';
import { SocialMedia } from './profiles/entities/social-media.entity';
import { Order } from './orders/entities/order.entity';
import { OrderApplication } from './orders/entities/order-application.entity';
import { Match } from './matching/entities/match.entity';
import configuration from './config/configuration';
import { CollaborationsModule } from './collaborations/collaborations.module';
import { Collaboration } from './collaborations/entities/collaboration.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [
          User, 
          Chat, 
          ChatMessage, 
          Message, 
          Profile, 
          SocialMedia, 
          Order, 
          OrderApplication,
          Match,
          Collaboration
        ],
        synchronize: configService.get('database.synchronize'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    StatisticsModule,
    ProfilesModule,
    MessagesModule,
    MatchingModule,
    OrdersModule,
    ChatsModule,
    CollaborationsModule,
  ],
})
export class AppModule {}