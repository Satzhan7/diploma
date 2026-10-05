import { Module } from '@nestjs/common';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { OrdersModule } from './orders/orders.module';
import { ChatsModule } from './chats/chats.module';
import { CategoriesModule } from './categories/categories.module';
import { User } from './users/entities/user.entity';
import { Chat } from './chats/entities/chat.entity';
import { Message as ChatMessage } from './chats/entities/message.entity';
import { Profile } from './profiles/entities/profile.entity';
import { SocialMedia } from './profiles/entities/social-media.entity';
import { Order } from './orders/entities/order.entity';
import { OrderApplication } from './orders/entities/order-application.entity';
import { Deal } from './deals/entities/deal.entity';
import { DealsModule } from './deals/deals.module';
import { FilesModule } from './files/files.module';
import { PlanModule } from './plan/plan.module';
import { VerificationModule } from './verification/verification.module';
import { AdminModule } from './admin/admin.module';
import configuration from './config/configuration';
import { StoredFile } from './files/entities/stored-file.entity';
import { CreatorVerification } from './verification/entities/creator-verification.entity';
import { AuditLog } from './admin/entities/audit-log.entity';
import { EmailVerification } from './auth/entities/email-verification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Global rate limit; auth routes carry a tighter
    // per-route @Throttle in AuthController.
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
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
          Profile,
          SocialMedia,
          Order,
          OrderApplication,
          Deal,
          EmailVerification,
          StoredFile,
          CreatorVerification,
          AuditLog,
        ],
        synchronize: configService.get('database.synchronize'),
        migrationsRun: configService.get('database.migrationsRun'),
        migrations: configService.get('database.migrationsRun')
          ? [join(__dirname, 'database', 'migrations', '*.js')]
          : [],
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ProfilesModule,
    OrdersModule,
    ChatsModule,
    DealsModule,
    CategoriesModule,
    FilesModule,
    PlanModule,
    VerificationModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
