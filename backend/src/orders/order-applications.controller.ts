import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { OrderApplicationsService } from './order-applications.service';
import { CreateOrderApplicationDto } from './dto/create-order-application.dto';
import { UpdateOrderApplicationDto } from './dto/update-order-application.dto';
import { OrderApplication } from './entities/order-application.entity';
import { UserRole } from '../users/entities/user.entity';
import { ShortlistApplicationDto } from './dto/shortlist-application.dto';
import { ListOrderApplicationsQueryDto } from './dto/list-applications-query.dto';
import { ApplicantView, MyApplicationView } from './applicant-view';
import { Page, PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('order-applications')
@ApiBearerAuth()
@Controller('order-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderApplicationsController {
  constructor(
    private readonly orderApplicationsService: OrderApplicationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "The current user's applications, newest first" })
  findAll(
    @GetCurrentUser('sub') userId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<Page<MyApplicationView>> {
    return this.orderApplicationsService.findAllByUser(userId, query);
  }

  @Get('order/:orderId')
  @Roles(UserRole.BRAND)
  @ApiOperation({
    summary: 'Applicants of a brief, best match first (owning brand)',
  })
  findByOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @GetCurrentUser('sub') userId: string,
    @Query() query: ListOrderApplicationsQueryDto,
  ): Promise<Page<ApplicantView>> {
    return this.orderApplicationsService.findByOrder(orderId, userId, query);
  }

  @Post(':orderId')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Create a new order application' })
  @ApiResponse({
    status: 201,
    description: 'Order application successfully created',
    type: OrderApplication,
  })
  create(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @GetCurrentUser('sub') userId: string,
    @Body() createOrderApplicationDto: CreateOrderApplicationDto,
  ): Promise<OrderApplication> {
    return this.orderApplicationsService.create(
      orderId,
      userId,
      createOrderApplicationDto,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get application by id (applicant or order-owning brand)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the application',
    type: OrderApplication,
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('sub') userId: string,
    @GetCurrentUser('role') userRole: UserRole,
  ): Promise<OrderApplication> {
    return this.orderApplicationsService.findOne(id, {
      id: userId,
      role: userRole,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an application' })
  @ApiResponse({
    status: 200,
    description: 'Application successfully updated',
    type: OrderApplication,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('sub') userId: string,
    @GetCurrentUser('role') userRole: UserRole,
    @Body() updateOrderApplicationDto: UpdateOrderApplicationDto,
  ): Promise<OrderApplication> {
    return this.orderApplicationsService.update(
      id,
      userId,
      userRole,
      updateOrderApplicationDto,
    );
  }

  @Patch(':id/shortlist')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Add to or remove from the shortlist' })
  shortlist(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: ShortlistApplicationDto,
  ): Promise<{ id: string; shortlisted: boolean }> {
    return this.orderApplicationsService.setShortlisted(
      id,
      userId,
      dto.shortlisted,
    );
  }

  @Delete(':id')
  @Roles(UserRole.INFLUENCER)
  @ApiOperation({ summary: 'Withdraw an application' })
  @ApiResponse({
    status: 200,
    description: 'Application successfully withdrawn',
    type: OrderApplication,
  })
  withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<OrderApplication> {
    return this.orderApplicationsService.withdraw(id, userId);
  }
}
