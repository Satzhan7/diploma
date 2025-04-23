import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderApplication } from './entities/order-application.entity';
import { OrderApplicationsController } from './order-applications.controller';
import { OrderApplicationsService } from './order-applications.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { ChatsModule } from '../chats/chats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderApplication]),
    ProfilesModule,
    ChatsModule,
  ],
  controllers: [OrdersController, OrderApplicationsController],
  providers: [OrdersService, OrderApplicationsService],
  exports: [OrdersService, OrderApplicationsService],
})
export class OrdersModule {} 