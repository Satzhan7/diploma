import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created', type: Order })
  create(
    @GetCurrentUser('sub') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get('available')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get all available orders' })
  @ApiResponse({ status: 200, description: 'Return all available orders', type: [Order] })
  findAvailable(
    @Query('category') category?: string,
    @Query('minBudget') minBudget?: number,
    @Query('maxBudget') maxBudget?: number,
  ): Promise<Order[]> {
    return this.ordersService.findAvailable({ category, minBudget, maxBudget });
  }

  @Post(':id/apply')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Apply for an order' })
  @ApiResponse({ status: 200, description: 'Application successful', type: Order })
  apply(
    @Param('id') orderId: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<Order> {
    return this.ordersService.apply(orderId, userId);
  }

  @Get('brand')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Get all orders for the brand' })
  @ApiResponse({ status: 200, description: 'Return all brand orders', type: [Order] })
  findBrandOrders(@GetCurrentUser('sub') userId: string): Promise<Order[]> {
    return this.ordersService.findByBrand(userId);
  }

  @Get('influencer')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Get all orders for the influencer' })
  @ApiResponse({ status: 200, description: 'Return all influencer orders', type: [Order] })
  findInfluencerOrders(@GetCurrentUser('sub') userId: string): Promise<Order[]> {
    return this.ordersService.findByInfluencer(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: 200, description: 'Return the order', type: Order })
  findOne(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }
} 