import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileType } from '../profiles/entities/profile.entity';
import { UserRole } from '../users/entities/user.entity';
import { PublicUser, toPublicUser } from '../users/public-user';
import { apiError, ErrorCode } from '../common/errors/error-codes';

export type PublicOrder = Pick<
  Order,
  | 'id'
  | 'title'
  | 'description'
  | 'budget'
  | 'category'
  | 'requirements'
  | 'deadline'
  | 'status'
  | 'brandId'
  | 'createdAt'
  | 'updatedAt'
> & {
  brand: Omit<Order['brand'], 'user' | 'socialMediaData'> & {
    user?: PublicUser;
  };
};

export interface OrderViewer {
  id: string;
  role: UserRole;
}

// What any authenticated user may see of an OPEN order: the brief plus the
// brand's public identity. No emails, no assigned influencer.
export function toPublicOrder(order: Order): PublicOrder {
  const { user, ...brandProfile } = order.brand;
  return {
    id: order.id,
    title: order.title,
    description: order.description,
    budget: order.budget,
    category: order.category,
    requirements: order.requirements,
    deadline: order.deadline,
    status: order.status,
    brandId: order.brandId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    brand: { ...brandProfile, user: user ? toPublicUser(user) : undefined },
  };
}

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
      throw new BadRequestException(
        apiError(ErrorCode.ORDER_BRAND_ONLY, 'Only brands can create orders'),
      );
    }

    const order = this.orderRepository.create({
      ...createOrderDto,
      brand: brandProfile,
      brandId: brandProfile.id,
    });

    return this.orderRepository.save(order);
  }

  async findAvailable(filters: any = {}): Promise<PublicOrder[]> {
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

    const orders = await queryBuilder.getMany();
    return orders.map(toPublicOrder);
  }

  async findOne(id: string, viewer: OrderViewer): Promise<Order | PublicOrder> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['brand', 'brand.user', 'influencer', 'influencer.user'],
    });

    if (!order) {
      throw new NotFoundException(
        apiError(ErrorCode.ORDER_NOT_FOUND, `Order with ID ${id} not found`),
      );
    }

    const isParticipant =
      viewer.role === UserRole.ADMIN ||
      order.brand?.user?.id === viewer.id ||
      order.influencer?.user?.id === viewer.id;
    if (isParticipant) return order;

    if (order.status === OrderStatus.OPEN) return toPublicOrder(order);

    throw new ForbiddenException(
      apiError(
        ErrorCode.ORDER_ACCESS_DENIED,
        'You do not have access to this order',
      ),
    );
  }

  async apply(orderId: string, userId: string): Promise<Order> {
    const influencerProfile = await this.profilesService.findByUserId(userId);

    if (influencerProfile.type !== ProfileType.INFLUENCER) {
      throw new BadRequestException(
        apiError(
          ErrorCode.ORDER_INFLUENCER_ONLY,
          'Only influencers can apply to orders',
        ),
      );
    }

    // Transaction + row lock: two influencers claiming the same open order
    // concurrently was a lost-update race (SECURITY_AUDIT M1).
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException(
          apiError(
            ErrorCode.ORDER_NOT_FOUND,
            `Order with ID ${orderId} not found`,
          ),
        );
      }
      if (order.status !== OrderStatus.OPEN) {
        throw new ConflictException(
          apiError(
            ErrorCode.ORDER_NOT_OPEN,
            'This order is no longer open for applications',
          ),
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
