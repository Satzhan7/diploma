import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import {
  ApplicationStatus,
  OrderApplication,
} from './entities/order-application.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  ListAvailableOrdersQueryDto,
  ListBrandOrdersQueryDto,
} from './dto/list-orders-query.dto';
import { BriefCounts, BriefView, toBriefView } from './brief-view';
import { assertBriefComplete, todayInKazakhstan } from './brief-completeness';
import { ProfilesService } from '../profiles/profiles.service';
import { Profile, ProfileType } from '../profiles/entities/profile.entity';
import { UserRole } from '../users/entities/user.entity';
import { apiError, ErrorCode } from '../common/errors/error-codes';
import { Page, PaginationQueryDto } from '../common/dto/pagination-query.dto';

export interface OrderViewer {
  id: string;
  role: UserRole;
}

const BRIEF_RELATIONS = { brand: { user: true } };

// Statuses a brand may still change the brief in.
const EDITABLE = [OrderStatus.DRAFT, OrderStatus.OPEN];

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly profilesService: ProfilesService,
    private readonly dataSource: DataSource,
  ) {}

  private async brandProfileOf(userId: string): Promise<Profile> {
    const profile = await this.profilesService.findByUserId(userId);
    if (profile.type !== ProfileType.BRAND) {
      throw new BadRequestException(
        apiError(ErrorCode.ORDER_BRAND_ONLY, 'Only brands can manage briefs'),
      );
    }
    return profile;
  }

  private notFound(id: string) {
    return new NotFoundException(
      apiError(ErrorCode.ORDER_NOT_FOUND, `Order with ID ${id} not found`),
    );
  }

  // Locks the brief row (no joins: FOR UPDATE cannot cover the nullable side
  // of an outer join) and checks that the brand owns it.
  private async lockOwned(
    manager: EntityManager,
    id: string,
    brand: Profile,
  ): Promise<Order> {
    const order = await manager.findOne(Order, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!order) throw this.notFound(id);
    if (order.brandId !== brand.id) {
      throw new ForbiddenException(
        apiError(ErrorCode.ORDER_ACCESS_DENIED, 'This brief is not yours'),
      );
    }
    return order;
  }

  private async viewOf(id: string, extra?: BriefCounts): Promise<BriefView> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: BRIEF_RELATIONS,
    });
    if (!order) throw this.notFound(id);
    return toBriefView(order, extra);
  }

  /** Always a draft; `publish` makes it visible to creators. */
  async create(userId: string, dto: CreateOrderDto): Promise<BriefView> {
    const brand = await this.brandProfileOf(userId);
    const order = await this.orderRepository.save(
      this.orderRepository.create({
        ...dto,
        brandId: brand.id,
        status: OrderStatus.DRAFT,
      }),
    );
    return this.viewOf(order.id);
  }

  // Drafts take any partial change. An open brief stays complete: the
  // change is refused when it would leave the brief unpublishable.
  async update(
    id: string,
    userId: string,
    dto: UpdateOrderDto,
  ): Promise<BriefView> {
    const brand = await this.brandProfileOf(userId);
    await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwned(manager, id, brand);
      if (!EDITABLE.includes(order.status)) {
        throw new ConflictException(
          apiError(
            ErrorCode.ORDER_NOT_EDITABLE,
            `A ${order.status} brief cannot be edited`,
          ),
        );
      }
      for (const [key, value] of Object.entries(dto)) {
        if (value !== undefined) Object.assign(order, { [key]: value });
      }
      if (order.status === OrderStatus.OPEN) assertBriefComplete(order);
      await manager.save(Order, order);
    });
    return this.viewOf(id);
  }

  async publish(id: string, userId: string): Promise<BriefView> {
    const brand = await this.brandProfileOf(userId);
    await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwned(manager, id, brand);
      if (order.status !== OrderStatus.DRAFT) {
        throw new ConflictException(
          apiError(
            ErrorCode.ORDER_INVALID_TRANSITION,
            `Only a draft can be published (this brief is ${order.status})`,
          ),
        );
      }
      assertBriefComplete(order);
      order.status = OrderStatus.OPEN;
      order.publishedAt = new Date();
      await manager.save(Order, order);
    });
    return this.viewOf(id);
  }

  // Cancelling closes the brief and rejects the applications still waiting.
  // Acceptance takes the same order lock, so the two cannot interleave.
  async cancel(id: string, userId: string): Promise<BriefView> {
    const brand = await this.brandProfileOf(userId);
    await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwned(manager, id, brand);
      if (!EDITABLE.includes(order.status)) {
        throw new ConflictException(
          apiError(
            ErrorCode.ORDER_INVALID_TRANSITION,
            `A ${order.status} brief cannot be cancelled`,
          ),
        );
      }
      order.status = OrderStatus.CANCELLED;
      await manager.save(Order, order);
      await manager.update(
        OrderApplication,
        { order: { id }, status: ApplicationStatus.PENDING },
        { status: ApplicationStatus.REJECTED },
      );
    });
    return this.viewOf(id);
  }

  // Per brief: applications that are not withdrawn, and those still pending.
  private async countApplications(
    orderIds: string[],
  ): Promise<Map<string, { applications: number; pending: number }>> {
    const counts = new Map<string, { applications: number; pending: number }>();
    if (!orderIds.length) return counts;
    const rows = await this.dataSource
      .getRepository(OrderApplication)
      .createQueryBuilder('app')
      .select('app."orderId"', 'orderId')
      .addSelect('COUNT(*) FILTER (WHERE app.status <> :withdrawn)', 'total')
      .addSelect('COUNT(*) FILTER (WHERE app.status = :pending)', 'pending')
      .where('app."orderId" IN (:...orderIds)', { orderIds })
      .setParameters({
        withdrawn: ApplicationStatus.WITHDRAWN,
        pending: ApplicationStatus.PENDING,
      })
      .groupBy('app."orderId"')
      .getRawMany<{ orderId: string; total: string; pending: string }>();
    for (const row of rows) {
      counts.set(row.orderId, {
        applications: Number(row.total),
        pending: Number(row.pending),
      });
    }
    return counts;
  }

  private async myApplications(
    orderIds: string[],
    userId: string,
  ): Promise<Map<string, OrderApplication>> {
    if (!orderIds.length) return new Map();
    const applications = await this.dataSource
      .getRepository(OrderApplication)
      .find({
        where: { order: { id: In(orderIds) }, applicant: { id: userId } },
        relations: { order: true },
      });
    return new Map(applications.map((a) => [a.order.id, a]));
  }

  private async withCreatorCounts(
    orders: Order[],
    userId: string,
  ): Promise<BriefView[]> {
    const ids = orders.map((o) => o.id);
    const [counts, mine] = await Promise.all([
      this.countApplications(ids),
      this.myApplications(ids, userId),
    ]);
    return orders.map((order) => {
      const own = mine.get(order.id);
      return toBriefView(order, {
        applicationsCount: counts.get(order.id)?.applications ?? 0,
        myApplication: own
          ? {
              id: own.id,
              status: own.status,
              proposedPrice: own.proposedPrice ?? null,
            }
          : null,
      });
    });
  }

  /** Creator feed: open briefs whose post-by date has not passed. */
  async findAvailable(
    userId: string,
    query: ListAvailableOrdersQueryDto,
  ): Promise<Page<BriefView>> {
    const { take, skip, category, platform, city } = query;
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.brand', 'brand')
      .leftJoinAndSelect('brand.user', 'brandUser')
      .where('order.status = :status', { status: OrderStatus.OPEN })
      .andWhere('order.postBy > :today', { today: todayInKazakhstan() })
      .orderBy('order.publishedAt', 'DESC')
      .addOrderBy('order.id', 'DESC')
      .take(take)
      .skip(skip);
    if (category) qb.andWhere('order.category = :category', { category });
    if (platform) qb.andWhere('order.platform = :platform', { platform });
    if (city) {
      qb.andWhere("order.city IN (:city, 'any')", { city });
    }
    const [orders, total] = await qb.getManyAndCount();
    return {
      items: await this.withCreatorCounts(orders, userId),
      total,
      take,
      skip,
    };
  }

  async findOne(id: string, viewer: OrderViewer): Promise<BriefView> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { ...BRIEF_RELATIONS, influencer: { user: true } },
    });
    if (!order) throw this.notFound(id);

    const isOwner =
      viewer.role === UserRole.ADMIN || order.brand?.user?.id === viewer.id;
    if (isOwner) {
      const counts = (await this.countApplications([id])).get(id);
      return toBriefView(order, {
        applicationsCount: counts?.applications ?? 0,
        pendingCount: counts?.pending ?? 0,
      });
    }

    // Creators see open briefs; applicants and the assigned creator keep the
    // brief after it closes, so their application or deal keeps its context.
    const [view] = await this.withCreatorCounts([order], viewer.id);
    if (
      order.status === OrderStatus.OPEN ||
      order.influencer?.user?.id === viewer.id ||
      view.myApplication
    ) {
      return view;
    }
    throw new ForbiddenException(
      apiError(
        ErrorCode.ORDER_ACCESS_DENIED,
        'You do not have access to this order',
      ),
    );
  }

  async findByBrand(
    userId: string,
    query: ListBrandOrdersQueryDto,
  ): Promise<Page<BriefView>> {
    const brand = await this.brandProfileOf(userId);
    const { take, skip, status } = query;
    const [orders, total] = await this.orderRepository.findAndCount({
      where: {
        brandId: brand.id,
        ...(status?.length && { status: In(status) }),
      },
      relations: BRIEF_RELATIONS,
      order: { updatedAt: 'DESC', id: 'DESC' },
      take,
      skip,
    });
    const counts = await this.countApplications(orders.map((o) => o.id));
    return {
      items: orders.map((order) =>
        toBriefView(order, {
          applicationsCount: counts.get(order.id)?.applications ?? 0,
          pendingCount: counts.get(order.id)?.pending ?? 0,
        }),
      ),
      total,
      take,
      skip,
    };
  }

  // Order foreign keys reference Profile IDs. Public service methods receive
  // the authenticated User ID, so resolve it once at this boundary rather than
  // comparing a User ID to a Profile FK.
  async findByInfluencer(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Page<BriefView>> {
    const { take, skip } = query;
    const influencerProfile = await this.profilesService.findByUserId(userId);
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { influencerId: influencerProfile.id },
      relations: BRIEF_RELATIONS,
      order: { updatedAt: 'DESC', id: 'DESC' },
      take,
      skip,
    });
    return { items: orders.map((o) => toBriefView(o)), total, take, skip };
  }
}
