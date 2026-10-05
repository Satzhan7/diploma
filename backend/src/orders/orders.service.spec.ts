import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { ApplicationStatus } from './entities/order-application.entity';
import { BriefGoal, BriefPlatform } from './brief-options';
import { briefProblems, todayInKazakhstan } from './brief-completeness';
import { UserRole } from '../users/entities/user.entity';
import { ErrorCode } from '../common/errors/error-codes';

const brandUser = { id: 'brand-user', name: 'Brand', email: 'b@example.test' };
const creatorUser = { id: 'creator-user', name: 'Cr', email: 'c@example.test' };
const BRAND_PROFILE = { id: 'brand-profile', type: 'brand' };

const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

function completeBrief(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    title: 'Autumn menu',
    description: 'Second café in Almaty',
    goal: BriefGoal.LAUNCH,
    platform: BriefPlatform.INSTAGRAM,
    formats: ['reel'],
    city: 'almaty',
    languages: ['ru'],
    category: 'Food',
    budgetMin: 60000,
    budgetMax: 120000,
    deliverables: '1 Reel + 3 Stories',
    requirements: null,
    postBy: inDays(10),
    publishedAt: null,
    status: OrderStatus.DRAFT,
    brandId: 'brand-profile',
    brand: { id: 'brand-profile', user: brandUser },
    ...overrides,
  } as unknown as Order;
}

// One fake per collaborator; `locked` is the row the transaction sees.
function setup(locked: Order | null, profile: object = BRAND_PROFILE) {
  const manager = {
    findOne: jest.fn().mockResolvedValue(locked),
    save: jest.fn().mockImplementation((_e, entity) => entity),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const rawCounts: object[] = [];
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['select', 'addSelect', 'where', 'setParameters', 'groupBy'])
    qb[m] = jest.fn().mockReturnValue(qb);
  qb.getRawMany = jest.fn().mockResolvedValue(rawCounts);
  const applications = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    find: jest.fn().mockResolvedValue([]),
  };
  const orderRepository = {
    create: jest.fn().mockImplementation((o) => ({ id: 'new-order', ...o })),
    save: jest.fn().mockImplementation((o) => o),
    findOne: jest.fn().mockResolvedValue(locked),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  const profilesService = {
    findByUserId: jest.fn().mockResolvedValue(profile),
  };
  const dataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(manager)),
    getRepository: () => applications,
  };
  const service = new OrdersService(
    orderRepository as any,
    profilesService as any,
    dataSource as any,
  );
  return { service, manager, orderRepository, applications, rawCounts };
}

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return (error as { response?: { code?: string } }).response?.code;
  }
  throw new Error('expected a rejection');
}

describe('brief completeness', () => {
  it('passes a complete brief', () => {
    expect(briefProblems(completeBrief())).toEqual([]);
  });

  it('names every missing field with isNotEmpty', () => {
    const problems = briefProblems(
      completeBrief({ description: '  ', formats: [], postBy: null }),
    );
    expect(problems.map((p) => [p.field, p.rule])).toEqual([
      ['description', 'isNotEmpty'],
      ['formats', 'isNotEmpty'],
      ['postBy', 'isNotEmpty'],
    ]);
  });

  it('keeps category, languages and requirements optional', () => {
    const brief = completeBrief({ category: null, languages: [] });
    expect(briefProblems(brief)).toEqual([]);
  });

  it('rejects a budget range that runs backwards (budgetRange)', () => {
    const problems = briefProblems(
      completeBrief({ budgetMin: 200000, budgetMax: 100000 }),
    );
    expect(problems).toEqual([
      expect.objectContaining({ field: 'budgetMax', rule: 'budgetRange' }),
    ]);
  });

  it('rejects a post-by date of today or earlier (futureDate)', () => {
    const now = new Date('2026-10-04T20:00:00Z'); // 01:00 on the 5th in KZ
    expect(todayInKazakhstan(now)).toBe('2026-10-05');
    const problems = briefProblems(
      completeBrief({ postBy: '2026-10-05' }),
      now,
    );
    expect(problems).toEqual([
      expect.objectContaining({ field: 'postBy', rule: 'futureDate' }),
    ]);
    expect(briefProblems(completeBrief({ postBy: '2026-10-06' }), now)).toEqual(
      [],
    );
  });
});

describe('OrdersService.create', () => {
  it('always saves a draft owned by the brand profile', async () => {
    const { service, orderRepository } = setup(completeBrief());
    await service.create('brand-user', { title: 'Draft' });
    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Draft',
        brandId: 'brand-profile',
        status: OrderStatus.DRAFT,
      }),
    );
  });

  it('refuses a creator profile', async () => {
    const { service } = setup(null, { id: 'p', type: 'influencer' });
    expect(await codeOf(service.create('u', { title: 'Draft' }))).toBe(
      ErrorCode.ORDER_BRAND_ONLY,
    );
  });
});

describe('OrdersService.publish', () => {
  it('opens a complete draft and stamps publishedAt', async () => {
    const draft = completeBrief();
    const { service, manager } = setup(draft);
    await service.publish('order-1', 'brand-user');
    expect(manager.save).toHaveBeenCalledWith(
      Order,
      expect.objectContaining({
        status: OrderStatus.OPEN,
        publishedAt: expect.any(Date),
      }),
    );
  });

  it('answers VALIDATION_FAILED with field details for an incomplete draft', async () => {
    const { service, manager } = setup(
      completeBrief({ goal: null, budgetMin: 5, budgetMax: 1 }),
    );
    const error = await service
      .publish('order-1', 'brand-user')
      .catch((e: BadRequestException) => e);
    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
      details: [
        expect.objectContaining({ field: 'goal', rule: 'isNotEmpty' }),
        expect.objectContaining({ field: 'budgetMax', rule: 'budgetRange' }),
      ],
    });
    expect(manager.save).not.toHaveBeenCalled();
  });

  it.each([OrderStatus.OPEN, OrderStatus.CANCELLED, OrderStatus.IN_PROGRESS])(
    'refuses to publish a %s brief',
    async (status) => {
      const { service } = setup(completeBrief({ status }));
      expect(await codeOf(service.publish('order-1', 'brand-user'))).toBe(
        ErrorCode.ORDER_INVALID_TRANSITION,
      );
    },
  );

  it("refuses another brand's brief", async () => {
    const { service } = setup(completeBrief({ brandId: 'other-brand' }));
    await expect(service.publish('order-1', 'brand-user')).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe('OrdersService.update', () => {
  it('saves a partial change to a draft without checking completeness', async () => {
    const { service, manager } = setup(completeBrief({ description: null }));
    await service.update('order-1', 'brand-user', { budgetMin: 10 });
    expect(manager.save).toHaveBeenCalledWith(
      Order,
      expect.objectContaining({ budgetMin: 10, description: null }),
    );
  });

  it('keeps an open brief complete', async () => {
    const { service, manager } = setup(
      completeBrief({ status: OrderStatus.OPEN }),
    );
    expect(
      await codeOf(
        service.update('order-1', 'brand-user', { deliverables: null }),
      ),
    ).toBe(ErrorCode.VALIDATION_FAILED);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('ignores fields that were not sent', async () => {
    const { service, manager } = setup(completeBrief());
    await service.update('order-1', 'brand-user', { title: undefined });
    expect(manager.save).toHaveBeenCalledWith(
      Order,
      expect.objectContaining({ title: 'Autumn menu' }),
    );
  });

  it.each([
    OrderStatus.IN_PROGRESS,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ])('refuses to edit a %s brief (ORDER_NOT_EDITABLE)', async (status) => {
    const { service } = setup(completeBrief({ status }));
    const promise = service.update('order-1', 'brand-user', { title: 'New' });
    await expect(promise).rejects.toThrow(ConflictException);
    expect(await codeOf(promise)).toBe(ErrorCode.ORDER_NOT_EDITABLE);
  });
});

describe('OrdersService.cancel', () => {
  it.each([OrderStatus.DRAFT, OrderStatus.OPEN])(
    'cancels a %s brief and rejects the pending applications',
    async (status) => {
      const { service, manager } = setup(completeBrief({ status }));
      await service.cancel('order-1', 'brand-user');
      expect(manager.save).toHaveBeenCalledWith(
        Order,
        expect.objectContaining({ status: OrderStatus.CANCELLED }),
      );
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        { order: { id: 'order-1' }, status: ApplicationStatus.PENDING },
        { status: ApplicationStatus.REJECTED },
      );
    },
  );

  it('refuses to cancel a brief in progress', async () => {
    const { service, manager } = setup(
      completeBrief({ status: OrderStatus.IN_PROGRESS }),
    );
    expect(await codeOf(service.cancel('order-1', 'brand-user'))).toBe(
      ErrorCode.ORDER_INVALID_TRANSITION,
    );
    expect(manager.update).not.toHaveBeenCalled();
  });
});

describe('OrdersService.findOne access control', () => {
  const withCreator = (status: OrderStatus) =>
    completeBrief({
      status,
      influencer: { id: 'creator-profile', user: creatorUser },
    } as Partial<Order>);

  it.each([
    ['owning brand', { id: 'brand-user', role: UserRole.BRAND }],
    ['admin', { id: 'admin', role: UserRole.ADMIN }],
  ])('shows any status to the %s with counts', async (_, viewer) => {
    const { service, rawCounts } = setup(withCreator(OrderStatus.DRAFT));
    rawCounts.push({ orderId: 'order-1', total: '3', pending: '2' });
    const view = await service.findOne('order-1', viewer);
    expect(view).toMatchObject({ applicationsCount: 3, pendingCount: 2 });
  });

  it('shows an open brief to any creator, without emails', async () => {
    const { service } = setup(completeBrief({ status: OrderStatus.OPEN }));
    const view = await service.findOne('order-1', {
      id: 'stranger',
      role: UserRole.INFLUENCER,
    });
    expect(view.myApplication).toBeNull();
    expect(JSON.stringify(view)).not.toContain('@example.test');
  });

  it('hides a draft from creators', async () => {
    const { service } = setup(completeBrief());
    await expect(
      service.findOne('order-1', { id: 'stranger', role: UserRole.INFLUENCER }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('keeps a closed brief visible to an applicant', async () => {
    const { service, applications } = setup(withCreator(OrderStatus.CANCELLED));
    applications.find.mockResolvedValue([
      {
        id: 'app-1',
        status: ApplicationStatus.REJECTED,
        proposedPrice: 90000,
        order: { id: 'order-1' },
      },
    ]);
    const view = await service.findOne('order-1', {
      id: 'applicant',
      role: UserRole.INFLUENCER,
    });
    expect(view.myApplication).toEqual({
      id: 'app-1',
      status: ApplicationStatus.REJECTED,
      proposedPrice: 90000,
    });
  });

  it('keeps an accepted brief visible to the assigned creator', async () => {
    const { service } = setup(withCreator(OrderStatus.IN_PROGRESS));
    await expect(
      service.findOne('order-1', {
        id: 'creator-user',
        role: UserRole.INFLUENCER,
      }),
    ).resolves.toMatchObject({ id: 'order-1' });
  });
});

describe('OrdersService lists', () => {
  it('pages the brand list and filters by status', async () => {
    const { service, orderRepository, rawCounts } = setup(null);
    orderRepository.findAndCount.mockResolvedValue([[completeBrief()], 41]);
    rawCounts.push({ orderId: 'order-1', total: '4', pending: '1' });
    const page = await service.findByBrand('brand-user', {
      take: 20,
      skip: 20,
      status: [OrderStatus.DRAFT],
    });
    expect(orderRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20, skip: 20 }),
    );
    expect(page).toMatchObject({ total: 41, take: 20, skip: 20 });
    expect(page.items[0]).toMatchObject({
      applicationsCount: 4,
      pendingCount: 1,
    });
    expect(JSON.stringify(page)).not.toContain('@example.test');
  });

  it('resolves the creator profile before listing assigned briefs', async () => {
    const { service, orderRepository } = setup(null, {
      id: 'creator-profile',
    });
    await service.findByInfluencer('creator-user', { take: 5, skip: 0 });
    expect(orderRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { influencerId: 'creator-profile' },
        take: 5,
      }),
    );
  });
});
