import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.brand', 'brand')
      .leftJoinAndSelect('brand.user', 'brandUser')
      .where('order.status = :status', { status: OrderStatus.OPEN });

    if (filters.category) {
      queryBuilder.andWhere('order.category = :category', { category: filters.category });
    }

    if (filters.minBudget) {
      queryBuilder.andWhere('order.budget >= :minBudget', { minBudget: filters.minBudget });
    }

    if (filters.maxBudget) {
      queryBuilder.andWhere('order.budget <= :maxBudget', { maxBudget: filters.maxBudget });
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
    const order = await this.findOne(orderId);
    
    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException('This order is no longer open for applications');
    }

    const influencerProfile = await this.profilesService.findByUserId(userId);
    
    if (influencerProfile.type !== ProfileType.INFLUENCER) {
      throw new BadRequestException('Only influencers can apply to orders');
    }

    order.status = OrderStatus.IN_PROGRESS;
    order.influencer = influencerProfile;
    order.influencerId = influencerProfile.id;

    return this.orderRepository.save(order);
  }

  async findByBrand(brandId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { brandId },
      relations: ['brand', 'brand.user', 'influencer', 'influencer.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByInfluencer(influencerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { influencerId },
      relations: ['brand', 'brand.user', 'influencer', 'influencer.user'],
      order: { createdAt: 'DESC' },
    });
  }
} 