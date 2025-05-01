import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderApplication } from './entities/order-application.entity';
import { OrderApplicationsController } from './order-applications.controller';
import { OrderApplicationsService } from './order-applications.service';
import { UsersModule } from 'src/users/users.module';
import { ProfilesModule } from 'src/profiles/profiles.module';
import { ChatsModule } from 'src/chats/chats.module';
import { MatchingModule } from 'src/matching/matching.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderApplication]),
    UsersModule,
    ProfilesModule,
    ChatsModule,
    MatchingModule,
  ],
  controllers: [OrdersController, OrderApplicationsController],
  providers: [OrdersService, OrderApplicationsService],
  exports: [OrdersService, OrderApplicationsService]
})
export class OrdersModule {} 