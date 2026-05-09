import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { OrderApplicationsService } from './order-applications.service';
import { CreateOrderApplicationDto } from './dto/create-order-application.dto';
import { UpdateOrderApplicationDto } from './dto/update-order-application.dto';
import { OrderApplication } from './entities/order-application.entity';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('order-applications')
@ApiBearerAuth()
@Controller('order-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderApplicationsController {
  constructor(private readonly orderApplicationsService: OrderApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all applications for the current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all applications for the current user', 
    type: [OrderApplication] 
  })
  findAll(@GetCurrentUser('sub') userId: string): Promise<OrderApplication[]> {
    return this.orderApplicationsService.findAllByUser(userId);
  }

  @Get('order/:orderId')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Get all applications for an order' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all applications for the order', 
    type: [OrderApplication] 
  })
  findByOrder(
    @Param('orderId') orderId: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<OrderApplication[]> {
    return this.orderApplicationsService.findByOrder(orderId, userId);
  }

  @Post(':orderId')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Create a new order application' })
  @ApiResponse({ 
    status: 201, 
    description: 'Order application successfully created', 
    type: OrderApplication 
  })
  create(
    @Param('orderId') orderId: string,
    @GetCurrentUser('sub') userId: string,
    @Body() createOrderApplicationDto: CreateOrderApplicationDto,
  ): Promise<OrderApplication> {
    console.log('Controller: creating application:', { orderId, userId, dto: createOrderApplicationDto });
    return this.orderApplicationsService.create(orderId, userId, createOrderApplicationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the application', 
    type: OrderApplication 
  })
  findOne(@Param('id') id: string): Promise<OrderApplication> {
    return this.orderApplicationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an application' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application successfully updated', 
    type: OrderApplication 
  })
  update(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @GetCurrentUser('role') userRole: UserRole,
    @Body() updateOrderApplicationDto: UpdateOrderApplicationDto,
  ): Promise<OrderApplication> {
    return this.orderApplicationsService.update(id, userId, userRole, updateOrderApplicationDto);
  }

  @Delete(':id')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Withdraw an application' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application successfully withdrawn', 
    type: OrderApplication 
  })
  withdraw(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<OrderApplication> {
    return this.orderApplicationsService.withdraw(id, userId);
  }
} 