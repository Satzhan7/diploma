import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { OrdersService, OrderViewer } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  ListAvailableOrdersQueryDto,
  ListBrandOrdersQueryDto,
} from './dto/list-orders-query.dto';
import { BriefView } from './brief-view';
import { UserRole } from '../users/entities/user.entity';
import { Page, PaginationQueryDto } from '../common/dto/pagination-query.dto';

// Orders are the briefs a brand posts. A brief starts as a draft, is
// published (OPEN) when complete, and closes when an application is
// accepted (IN_PROGRESS) or the brand cancels it.
@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Save a new brief as a draft' })
  @ApiResponse({ status: 201, description: 'Draft created' })
  create(
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<BriefView> {
    return this.ordersService.create(userId, dto);
  }

  @Get('available')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Creator feed: open briefs, newest first' })
  findAvailable(
    @GetCurrentUser('sub') userId: string,
    @Query() query: ListAvailableOrdersQueryDto,
  ): Promise<Page<BriefView>> {
    return this.ordersService.findAvailable(userId, query);
  }

  @Get('brand')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: "The brand's briefs with application counts" })
  findBrandOrders(
    @GetCurrentUser('sub') userId: string,
    @Query() query: ListBrandOrdersQueryDto,
  ): Promise<Page<BriefView>> {
    return this.ordersService.findByBrand(userId, query);
  }

  @Get('influencer')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Briefs the creator was accepted on' })
  findInfluencerOrders(
    @GetCurrentUser('sub') userId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<Page<BriefView>> {
    return this.ordersService.findByInfluencer(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brief' })
  @ApiResponse({
    status: 403,
    description:
      'Not the owning brand, an applicant, the assigned creator or an admin, and the brief is not open',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser() viewer: OrderViewer,
  ): Promise<BriefView> {
    return this.ordersService.findOne(id, viewer);
  }

  @Patch(':id')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Edit a draft or open brief' })
  @ApiResponse({ status: 409, description: 'ORDER_NOT_EDITABLE' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<BriefView> {
    return this.ordersService.update(id, userId, dto);
  }

  @Post(':id/publish')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Publish a complete draft' })
  @ApiResponse({
    status: 400,
    description: 'VALIDATION_FAILED with the missing fields',
  })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<BriefView> {
    return this.ordersService.publish(id, userId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Cancel a draft or open brief' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<BriefView> {
    return this.ordersService.cancel(id, userId);
  }
}
