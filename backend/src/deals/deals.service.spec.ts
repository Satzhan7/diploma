import { ConflictException, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { DealsService } from './deals.service';
import { Deal, DealStatus } from './entities/deal.entity';
import { UserRole } from '../users/entities/user.entity';

const party = (userId: string, extra: Record<string, unknown>) => ({
  id: `${userId}-profile`,
  avatarUrl: null,
  location: 'Almaty',
  user: {
    id: userId,
    name: `${userId} name`,
    email: `${userId}@example.test`,
    password: '$2b$10$hash',
  },
  ...extra,
});

const storedDeal = (status = DealStatus.ACTIVE) => ({
  id: 'deal-1',
  status,
  agreedPrice: 90000,
  deliverables: '1 Reel + 3 Stories',
  postBy: '2026-10-15',
  createdAt: new Date('2026-10-01'),
  updatedAt: new Date('2026-10-01'),
  order: { id: 'order-1', title: 'Spring menu launch', category: 'Food' },
  brandProfile: party('brand-user', { companyName: 'Café Daryn' }),
  creatorProfile: party('creator-user', { displayName: 'Arman' }),
});

describe('DealsService.createForAcceptedApplication', () => {
  const order = {
    id: 'order-1',
    brandId: 'brand-profile',
    budgetMin: 60000,
    budgetMax: 120000,
    deliverables: '1 Reel + 3 Stories',
    requirements: 'Tag @cafe.daryn',
    postBy: '2026-10-15',
  } as any;

  const managerWith = (existing: unknown) => ({
    findOne: jest.fn().mockResolvedValue(existing),
    create: jest.fn((_entity, data) => data),
    save: jest.fn((_entity, data) => ({ id: 'deal-1', ...data })),
  });

  it('copies the terms: proposed price wins over the budget', async () => {
    const manager = managerWith(null);
    const service = new DealsService({} as any);

    const deal = await service.createForAcceptedApplication(
      manager as any,
      order,
      { id: 'application-1', proposedPrice: 90000 } as any,
      'creator-profile',
    );

    expect(manager.save).toHaveBeenCalledWith(Deal, {
      orderId: 'order-1',
      applicationId: 'application-1',
      brandProfileId: 'brand-profile',
      creatorProfileId: 'creator-profile',
      agreedPrice: 90000,
      deliverables: '1 Reel + 3 Stories',
      postBy: '2026-10-15',
      status: DealStatus.ACTIVE,
    });
    expect(deal.id).toBe('deal-1');
  });

  it('falls back to the top of the brief budget when no price was proposed', async () => {
    const manager = managerWith(null);
    await new DealsService({} as any).createForAcceptedApplication(
      manager as any,
      order,
      { id: 'application-1', proposedPrice: null } as any,
      'creator-profile',
    );
    expect(manager.save.mock.calls[0][1].agreedPrice).toBe(120000);
  });

  it('is idempotent: an existing deal for the application is returned', async () => {
    const existing = { id: 'deal-0', applicationId: 'application-1' };
    const manager = managerWith(existing);

    const deal = await new DealsService({} as any).createForAcceptedApplication(
      manager as any,
      order,
      { id: 'application-1' } as any,
      'creator-profile',
    );

    expect(deal).toBe(existing);
    expect(manager.findOne).toHaveBeenCalledWith(Deal, {
      where: { applicationId: 'application-1' },
    });
    expect(manager.save).not.toHaveBeenCalled();
  });
});

describe('DealsService.findOneForUser', () => {
  const service = (deal: unknown) =>
    new DealsService({ findOne: jest.fn().mockResolvedValue(deal) } as any);

  it.each([
    ['brand', { id: 'brand-user', role: UserRole.BRAND }],
    ['creator', { id: 'creator-user', role: UserRole.INFLUENCER }],
    ['admin', { id: 'admin-user', role: UserRole.ADMIN }],
  ])('returns the deal to the %s without any email', async (_l, viewer) => {
    const view = await service(storedDeal()).findOneForUser('deal-1', viewer);

    expect(view).toMatchObject({
      id: 'deal-1',
      agreedPrice: 90000,
      order: { id: 'order-1', title: 'Spring menu launch' },
      brand: { userId: 'brand-user', name: 'Café Daryn' },
      creator: { userId: 'creator-user', name: 'Arman' },
    });
    expect(JSON.stringify(view)).not.toMatch(/email|password|\$2b\$/);
  });

  it('answers 404 to a non-participant, same as a missing deal', async () => {
    const stranger = { id: 'other-user', role: UserRole.INFLUENCER };
    await expect(
      service(storedDeal()).findOneForUser('deal-1', stranger),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service(null).findOneForUser('deal-1', stranger),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DealsService.findForUser', () => {
  it('pages the viewer’s deals and filters by status', async () => {
    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[storedDeal()], 21]),
    };
    const service = new DealsService({
      createQueryBuilder: jest.fn(() => qb),
    } as any);

    const page = await service.findForUser(
      { id: 'creator-user', role: UserRole.INFLUENCER },
      { take: 20, skip: 20, status: DealStatus.ACTIVE },
    );

    expect(qb.where).toHaveBeenCalledWith(
      '(brandUser.id = :uid OR creatorUser.id = :uid)',
      { uid: 'creator-user' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('deal.status = :status', {
      status: DealStatus.ACTIVE,
    });
    // id breaks createdAt ties so pages do not overlap or skip rows.
    expect(qb.addOrderBy).toHaveBeenCalledWith('deal.id', 'DESC');
    expect(qb.take).toHaveBeenCalledWith(20);
    expect(qb.skip).toHaveBeenCalledWith(20);
    expect(page).toMatchObject({ total: 21, take: 20, skip: 20 });
    expect(page.items[0].creator.name).toBe('Arman');
    expect(JSON.stringify(page)).not.toMatch(/email|password/);
  });
});

describe('DealsService.changeStatus', () => {
  const repo = (status: DealStatus, affected = 1) => ({
    findOne: jest.fn().mockResolvedValue({ id: 'deal-1', status }),
    update: jest.fn().mockResolvedValue({ affected }),
  });

  it('applies an allowed change as a compare-and-set', async () => {
    const repository = repo(DealStatus.ACTIVE);
    await new DealsService(repository as any).changeStatus(
      'deal-1',
      DealStatus.PROOF_SUBMITTED,
    );
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'deal-1', status: In([DealStatus.ACTIVE]) },
      { status: DealStatus.PROOF_SUBMITTED },
    );
  });

  it('rejects a forbidden change before touching the row', async () => {
    const repository = repo(DealStatus.COMPLETED);
    await expect(
      new DealsService(repository as any).changeStatus(
        'deal-1',
        DealStatus.ACTIVE,
      ),
    ).rejects.toMatchObject({ response: { code: 'DEAL_INVALID_TRANSITION' } });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns 409 when a concurrent change won', async () => {
    const repository = repo(DealStatus.ACTIVE, 0);
    await expect(
      new DealsService(repository as any).changeStatus(
        'deal-1',
        DealStatus.CANCELLED,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
