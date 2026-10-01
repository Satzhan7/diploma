import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileType } from '../profiles/entities/profile.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly profilesService: ProfilesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const brandProfile = await this.profilesService.findByUserId(userId);

    if (brandProfile.type !== ProfileType.BRAND) {
      throw new BadRequestException('Only brands can create orders');
    }

    const order = this.orderRepository.create({
      ...createOrderDto,
      brand: brandProfile,
      brandId: brandProfile.id,
    });

    return this.orderRepository.save(order);
  }

  async findAvailable(filters: any = {}): Promise<Order[]> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.brand', 'brand')
      .leftJoinAndSelect('brand.user', 'brandUser')
      .where('order.status = :status', { status: OrderStatus.OPEN });

    if (filters.category) {
      queryBuilder.andWhere('order.category = :category', {
        category: filters.category,
      });
    }

    if (filters.minBudget) {
      queryBuilder.andWhere('order.budget >= :minBudget', {
        minBudget: filters.minBudget,
      });
    }

    if (filters.maxBudget) {
      queryBuilder.andWhere('order.budget <= :maxBudget', {
        maxBudget: filters.maxBudget,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['brand', 'brand.user', 'influencer', 'influencer.user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async apply(orderId: string, userId: string): Promise<Order> {
    const influencerProfile = await this.profilesService.findByUserId(userId);

    if (influencerProfile.type !== ProfileType.INFLUENCER) {
      throw new BadRequestException('Only influencers can apply to orders');
    }

    // Transaction + row lock: two influencers claiming the same open order
    // concurrently was a lost-update race (SECURITY_AUDIT M1).
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
      if (order.status !== OrderStatus.OPEN) {
        throw new ConflictException(
          'This order is no longer open for applications',
        );
      }

      order.status = OrderStatus.IN_PROGRESS;
      order.influencerId = influencerProfile.id;

      return manager.save(Order, order);
    });
  }

  async findByBrand(userId: string): Promise<Order[]> {
    const brandProfile = await this.profilesService.findByUserId(userId);

    return this.orderRepository.find({
      where: { brandId: brandProfile.id },
      relations: [
        'brand',
        'brand.user',
        'influencer',
        'influencer.user',
        'applications',
        'applications.applicant',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // Order foreign keys reference Profile IDs. Public service methods receive
  // the authenticated User ID, so resolve it once at this boundary rather than
  // comparing a User ID to a Profile FK.
  async findByInfluencer(userId: string): Promise<Order[]> {
    const influencerProfile = await this.profilesService.findByUserId(userId);

    return this.orderRepository.find({
      where: { influencerId: influencerProfile.id },
      relations: ['brand', 'brand.user', 'influencer', 'influencer.user'],
      order: { createdAt: 'DESC' },
    });
  }
}
