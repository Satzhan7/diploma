import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { OrderApplication, ApplicationStatus } from './entities/order-application.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderApplicationDto } from './dto/create-order-application.dto';
import { UpdateOrderApplicationDto } from './dto/update-order-application.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { UserRole } from '../users/entities/user.entity';
import { ChatsService } from '../chats/chats.service';

@Injectable()
export class OrderApplicationsService {
  constructor(
    @InjectRepository(OrderApplication)
    private readonly orderApplicationRepository: Repository<OrderApplication>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly profilesService: ProfilesService,
    private readonly chatsService: ChatsService,
  ) {}

  async create(
    orderId: string, 
    userId: string, 
    createOrderApplicationDto: CreateOrderApplicationDto
  ): Promise<OrderApplication> {
    console.log('Creating application with data:', { orderId, userId, dto: createOrderApplicationDto });
    
    const order = await this.orderRepository.findOne({ 
      where: { id: orderId },
      relations: ['brand', 'brand.user'] 
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    console.log('Found order:', { id: order.id, status: order.status });

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException('This order is not open for applications');
    }

    // Check if the user already applied to this order
    const existingApplication = await this.orderApplicationRepository.findOne({
      where: {
        order: { id: orderId },
        applicant: { id: userId }
      }
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied to this order');
    }

    const application = this.orderApplicationRepository.create({
      ...createOrderApplicationDto,
      order: { id: orderId },
      applicant: { id: userId },
      status: ApplicationStatus.PENDING
    });

    console.log('Created application object:', application);

    const savedApplication = await this.orderApplicationRepository.save(application);
    console.log('Saved application:', savedApplication);
    
    return savedApplication;
  }

  async findAllByUser(userId: string): Promise<OrderApplication[]> {
    return this.orderApplicationRepository.find({
      where: { applicant: { id: userId } },
      relations: ['order', 'order.brand'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<OrderApplication> {
    const application = await this.orderApplicationRepository.findOne({
      where: { id },
      relations: ['order', 'applicant', 'order.brand', 'order.brand.user']
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async update(
    id: string, 
    userId: string, 
    userRole: UserRole, 
    updateOrderApplicationDto: UpdateOrderApplicationDto
  ): Promise<OrderApplication> {
    const application = await this.findOne(id);
    
    // If user is an influencer, they can only update their own applications and only the message or proposedPrice
    if (userRole === UserRole.INFLUENCER) {
      if (application.applicant.id !== userId) {
        throw new ForbiddenException('You can only update your own applications');
      }
      
      if (updateOrderApplicationDto.status) {
        throw new ForbiddenException('Influencers cannot update application status');
      }
      
      if (application.status !== ApplicationStatus.PENDING) {
        throw new BadRequestException('You can only update pending applications');
      }
    } 
    // If user is a brand, they can only update the status of applications for their orders
    else if (userRole === UserRole.BRAND) {
      if (application.order.brand.user.id !== userId) {
        throw new ForbiddenException('You can only update applications for your own orders');
      }
      
      if (updateOrderApplicationDto.message || updateOrderApplicationDto.proposedPrice) {
        throw new ForbiddenException('Brands can only update application status');
      }
    }

    // Update the application
    Object.assign(application, updateOrderApplicationDto);
    
    // If brand accepts an application, update the order status and assign the influencer
    if (userRole === UserRole.BRAND && updateOrderApplicationDto.status === ApplicationStatus.ACCEPTED) {
      const order = await this.orderRepository.findOne({ 
        where: { id: application.order.id },
        relations: ['brand', 'brand.user'] 
      });
      
      if (!order) {
        throw new NotFoundException(`Order with ID ${application.order.id} not found`);
      }
      
      if (order.status !== OrderStatus.OPEN) {
        throw new BadRequestException('This order is not open for applications');
      }
      
      // Получаем профиль инфлюенсера
      const applicantProfile = await this.profilesService.findByUserId(application.applicant.id);
      if (!applicantProfile) {
        throw new NotFoundException(`Profile for applicant with ID ${application.applicant.id} not found`);
      }
      
      console.log(`Updating order ${order.id} to assign influencer ${applicantProfile.id}`);
      
      // Update the order with proper profile reference
      order.status = OrderStatus.IN_PROGRESS;
      order.influencerId = applicantProfile.id;
      await this.orderRepository.save(order);

      // Создаем чат между брендом и инфлюенсером
      try {
        const brandUserId = order.brand.user.id;
        const influencerUserId = application.applicant.id;
        
        console.log(`Creating chat between brand ${brandUserId} and influencer ${influencerUserId}`);
        
        const chat = await this.chatsService.create(brandUserId, influencerUserId);
        
        // Отправляем первое приветственное сообщение от бренда
        const welcomeMessage = `Привет! Твоя заявка на заказ "${order.title}" была принята. Давай обсудим детали!`;
        await this.chatsService.addMessage(chat.id, brandUserId, welcomeMessage);
        
        console.log(`Chat created with ID: ${chat.id}`);
      } catch (error) {
        console.error('Error creating chat:', error);
        // Не выбрасываем исключение, чтобы не отменять принятие заявки, если чат не создался
      }
      
      // Reject all other applications for this order
      await this.orderApplicationRepository.update(
        { 
          order: { id: order.id }, 
          id: Not(application.id)
        },
        { status: ApplicationStatus.REJECTED }
      );
    }

    return this.orderApplicationRepository.save(application);
  }

  async withdraw(id: string, userId: string): Promise<OrderApplication> {
    const application = await this.findOne(id);
    
    if (application.applicant.id !== userId) {
      throw new ForbiddenException('You can only withdraw your own applications');
    }
    
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('You can only withdraw pending applications');
    }
    
    application.status = ApplicationStatus.WITHDRAWN;
    return this.orderApplicationRepository.save(application);
  }

  async findByOrder(orderId: string, userId: string): Promise<OrderApplication[]> {
    const order = await this.orderRepository.findOne({ 
      where: { id: orderId },
      relations: ['brand', 'brand.user'] 
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.brand.user.id !== userId) {
      throw new ForbiddenException('You can only view applications for your own orders');
    }

    console.log(`Finding applications for order ID: ${orderId}`);
    
    const applications = await this.orderApplicationRepository.find({
      where: { order: { id: orderId } },
      relations: ['applicant', 'order']
    });
    
    console.log(`Found ${applications.length} applications for order ID: ${orderId}`);
    
    return applications;
  }
} 