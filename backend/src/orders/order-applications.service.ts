import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, DataSource } from 'typeorm';
import { OrderApplication, ApplicationStatus } from './entities/order-application.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderApplicationDto } from './dto/create-order-application.dto';
import { UpdateOrderApplicationDto } from './dto/update-order-application.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { UserRole } from '../users/entities/user.entity';
import { ChatsService } from '../chats/chats.service';
import { Match, MatchStatus } from '../matching/entities/match.entity';

@Injectable()
export class OrderApplicationsService {
  private readonly logger = new Logger(OrderApplicationsService.name);

  constructor(
    @InjectRepository(OrderApplication)
    private readonly orderApplicationRepository: Repository<OrderApplication>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly profilesService: ProfilesService,
    private readonly chatsService: ChatsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    orderId: string, 
    userId: string, 
    createOrderApplicationDto: CreateOrderApplicationDto
  ): Promise<OrderApplication> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['brand', 'brand.user'] 
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

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

    const savedApplication = await this.orderApplicationRepository.save(application);
    this.logger.log(`Application ${savedApplication.id} created for order ${orderId}`);

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

  // `requester` is passed from the controller for direct reads; internal
  // callers (update/withdraw) omit it and apply their own ownership rules.
  async findOne(
    id: string,
    requester?: { id: string; role: UserRole },
  ): Promise<OrderApplication> {
    const application = await this.orderApplicationRepository.findOne({
      where: { id },
      relations: ['order', 'applicant', 'order.brand', 'order.brand.user']
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Read ownership (SECURITY_AUDIT H3): only the applicant, the brand that
    // owns the order, or an admin may view an application.
    if (
      requester &&
      requester.role !== UserRole.ADMIN &&
      application.applicant?.id !== requester.id &&
      application.order?.brand?.user?.id !== requester.id
    ) {
      throw new ForbiddenException('You do not have access to this application');
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

    // If brand accepts an application: order assignment, application save,
    // match upsert and reject-others are one atomic transaction with a row
    // lock on the order (SECURITY_AUDIT M2). The chat seed stays outside the
    // transaction — it is best-effort and must not roll back an acceptance.
    if (userRole === UserRole.BRAND && updateOrderApplicationDto.status === ApplicationStatus.ACCEPTED) {
      const applicantProfile = await this.profilesService.findByUserId(application.applicant.id);
      if (!applicantProfile) {
        throw new NotFoundException(`Profile for applicant with ID ${application.applicant.id} not found`);
      }

      const { brandUserId, influencerUserId, orderTitle } = await this.dataSource.transaction(
        async (manager) => {
          const order = await manager.findOne(Order, {
            where: { id: application.order.id },
            lock: { mode: 'pessimistic_write' },
          });

          if (!order) {
            throw new NotFoundException(`Order with ID ${application.order.id} not found`);
          }
          if (order.status !== OrderStatus.OPEN) {
            throw new BadRequestException('This order is not open for applications');
          }

          order.status = OrderStatus.IN_PROGRESS;
          order.influencerId = applicantProfile.id;
          await manager.save(Order, order);

          await manager.save(OrderApplication, application);

          // Reject all other applications for this order
          await manager.update(
            OrderApplication,
            { order: { id: order.id }, id: Not(application.id) },
            { status: ApplicationStatus.REJECTED },
          );

          // Match upsert — keeps the matching lifecycle in sync. The lock was
          // taken on the order row inside this same transaction, so the FK
          // targets are loaded via relations fetched before the lock.
          const brandUid = application.order.brand.user.id;
          const influencerUid = application.applicant.id;
          const existingMatch = await manager.findOne(Match, {
            where: [
              { brandId: brandUid, influencerId: influencerUid },
              { brandId: influencerUid, influencerId: brandUid },
            ],
          });
          if (!existingMatch) {
            await manager.save(
              Match,
              manager.create(Match, {
                brandId: brandUid,
                influencerId: influencerUid,
                status: MatchStatus.ACCEPTED,
                name: order.title,
                category: order.category,
              }),
            );
          } else if (existingMatch.status === MatchStatus.PENDING) {
            existingMatch.status = MatchStatus.ACCEPTED;
            await manager.save(Match, existingMatch);
          }

          return {
            brandUserId: brandUid,
            influencerUserId: influencerUid,
            orderTitle: order.title,
          };
        },
      );

      // Best-effort chat seed (non-transactional by design).
      try {
        const chat = await this.chatsService.create(brandUserId, influencerUserId);
        const welcomeMessage = `Your application for "${orderTitle}" has been accepted. Let's discuss the details!`;
        await this.chatsService.addMessage(chat.id, brandUserId, welcomeMessage);
      } catch (error) {
        this.logger.error(`Chat seed after acceptance failed: ${(error as Error).message}`);
      }

      return application;
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

    return this.orderApplicationRepository.find({
      where: { order: { id: orderId } },
      relations: ['applicant', 'order']
    });
  }
} 