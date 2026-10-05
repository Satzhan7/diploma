import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { apiError, ErrorCode } from '../common/errors/error-codes';
import { Page } from '../common/dto/pagination-query.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderApplication } from '../orders/entities/order-application.entity';
import { UserRole } from '../users/entities/user.entity';
import { assertDealTransition, dealSourcesOf } from './deal-transitions';
import { DealView, toDealView } from './deal-view';
import { ListDealsQueryDto } from './dto/list-deals-query.dto';
import { Deal, DealStatus } from './entities/deal.entity';

export interface DealViewer {
  id: string;
  role: UserRole;
}

const DEAL_RELATIONS = {
  order: true,
  brandProfile: { user: true },
  creatorProfile: { user: true },
};

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
  ) {}

  // Runs inside the accept transaction (order row locked). Idempotent: a
  // deal already created for this application is returned unchanged.
  async createForAcceptedApplication(
    manager: EntityManager,
    order: Order,
    application: OrderApplication,
    creatorProfileId: string,
  ): Promise<Deal> {
    const existing = await manager.findOne(Deal, {
      where: { applicationId: application.id },
    });
    if (existing) return existing;

    return manager.save(
      Deal,
      manager.create(Deal, {
        orderId: order.id,
        applicationId: application.id,
        brandProfileId: order.brandId,
        creatorProfileId,
        // A creator who names no price takes the top of the brief's range.
        agreedPrice: application.proposedPrice ?? order.budgetMax ?? 0,
        deliverables: order.deliverables || null,
        postBy: order.postBy ?? null,
        status: DealStatus.ACTIVE,
      }),
    );
  }

  async findForUser(
    viewer: DealViewer,
    query: ListDealsQueryDto,
  ): Promise<Page<DealView>> {
    const { take, skip, status } = query;
    const qb = this.dealRepository
      .createQueryBuilder('deal')
      .innerJoinAndSelect('deal.order', 'order')
      .innerJoinAndSelect('deal.brandProfile', 'brandProfile')
      .leftJoinAndSelect('brandProfile.user', 'brandUser')
      .innerJoinAndSelect('deal.creatorProfile', 'creatorProfile')
      .leftJoinAndSelect('creatorProfile.user', 'creatorUser')
      .where('(brandUser.id = :uid OR creatorUser.id = :uid)', {
        uid: viewer.id,
      })
      .orderBy('deal.createdAt', 'DESC')
      .addOrderBy('deal.id', 'DESC')
      .take(take)
      .skip(skip);
    if (status) qb.andWhere('deal.status = :status', { status });

    const [deals, total] = await qb.getManyAndCount();
    return { items: deals.map(toDealView), total, take, skip };
  }

  async findOneForUser(id: string, viewer: DealViewer): Promise<DealView> {
    const deal = await this.dealRepository.findOne({
      where: { id },
      relations: DEAL_RELATIONS,
    });
    // Non-participants get the same 404 as a missing deal.
    const isParticipant =
      viewer.role === UserRole.ADMIN ||
      deal?.brandProfile.user?.id === viewer.id ||
      deal?.creatorProfile.user?.id === viewer.id;
    if (!deal || !isParticipant) {
      throw new NotFoundException(
        apiError(ErrorCode.DEAL_NOT_FOUND, `Deal with ID ${id} not found`),
      );
    }
    return toDealView(deal);
  }

  // The only way a deal changes status. R5 adds the endpoints (proof,
  // confirm, dispute, cancel) with their role rules on top of this.
  async changeStatus(id: string, to: DealStatus): Promise<void> {
    const deal = await this.dealRepository.findOne({ where: { id } });
    if (!deal) {
      throw new NotFoundException(
        apiError(ErrorCode.DEAL_NOT_FOUND, `Deal with ID ${id} not found`),
      );
    }
    assertDealTransition(deal.status, to);

    const result = await this.dealRepository.update(
      { id, status: In(dealSourcesOf(to)) },
      { status: to },
    );
    if (!result.affected) {
      throw new ConflictException(
        apiError(
          ErrorCode.DEAL_STALE,
          'Deal status changed; reload and try again',
        ),
      );
    }
  }
}
