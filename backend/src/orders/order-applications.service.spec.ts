import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { In } from 'typeorm';
import {
  OrderApplicationsService,
  assertApplicationTransition,
} from './order-applications.service';
import { OrderStatus } from './entities/order.entity';
import { todayInKazakhstan } from './brief-completeness';
import { ErrorCode } from '../common/errors/error-codes';
import {
  ApplicationStatus,
  OrderApplication,
} from './entities/order-application.entity';
import { UserRole } from '../users/entities/user.entity';
import { Plan } from '../plan/plan';

// PlanService and FilesService stubs: a Free brand, no portfolios.
const planStub = (plan = Plan.FREE) => ({
  forUser: jest.fn(async () => ({ plan })),
});
const filesStub = () => ({
  portfolioIdsFor: jest.fn(async () => new Map<string, string[]>()),
});

describe('OrderApplicationsService.create', () => {
  const manager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn((work) => work(manager)),
  };
  let service: OrderApplicationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderApplicationsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      planStub() as any,
      filesStub() as any,
      dataSource as any,
    );
  });

  it('locks the order and returns a conflict for duplicate applications', async () => {
    manager.findOne
      .mockResolvedValueOnce({ id: 'order-1', status: OrderStatus.OPEN })
      .mockResolvedValueOnce({ id: 'application-1' });

    await expect(
      service.create('order-1', 'influencer-1', { message: 'Interested' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.findOne).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });

  it('rejects applications after the order is no longer open', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.IN_PROGRESS,
    });

    await expect(
      service.create('order-1', 'influencer-1', { message: 'Interested' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects applications once the post-by date has arrived', async () => {
    manager.findOne.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.OPEN,
      postBy: todayInKazakhstan(),
    });

    await expect(
      service.create('order-1', 'influencer-1', { message: 'Interested' }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ORDER_EXPIRED },
    });
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('maps a database uniqueness race to a conflict response', async () => {
    dataSource.transaction.mockRejectedValueOnce({ code: '23505' });

    await expect(
      service.create('order-1', 'influencer-1', { message: 'Interested' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('OrderApplicationsService.findAllByUser', () => {
  it("returns the brand's user id for profile links but not its email", async () => {
    const repository = {
      findAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'application-1',
            order: {
              id: 'order-1',
              brand: {
                id: 'brand-profile',
                user: {
                  id: 'brand-user',
                  name: 'Brand',
                  role: 'brand',
                  email: 'brand@example.test',
                  password: '$2b$10$hash',
                },
              },
            },
          },
        ],
        1,
      ]),
    };
    const service = new OrderApplicationsService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      planStub() as any,
      filesStub() as any,
      {} as any,
    );

    const page = await service.findAllByUser('influencer-1', {
      take: 10,
      skip: 0,
    });
    const [application] = page.items;

    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: { order: { brand: { user: true } } },
        take: 10,
        skip: 0,
      }),
    );
    expect(page.total).toBe(1);
    expect(application.order.brand?.userId).toBe('brand-user');
    expect(application).not.toHaveProperty('shortlisted');
    expect(JSON.stringify(application)).not.toMatch(/email|password|\$2b\$/);
  });
  it('GET /order-applications/order/:orderId returns applicants without their email', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'application-1',
          applicant: {
            id: 'creator-user',
            name: 'Creator',
            email: 'creator@example.test',
            password: '$2b$10$hash',
          },
          order: { id: 'order-1' },
        },
      ]),
    };
    const orderRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'order-1',
        brand: { user: { id: 'brand-user', email: 'brand@example.test' } },
      }),
    };
    const service = new OrderApplicationsService(
      repository as any,
      orderRepository as any,
      {} as any,
      {} as any,
      {} as any,
      planStub() as any,
      filesStub() as any,
      {} as any,
    );

    const body = JSON.stringify(
      await service.findByOrder('order-1', 'brand-user', { take: 20, skip: 0 }),
    );
    expect(body).toContain('creator-user');
    expect(body).not.toMatch(/email|password|\$2b\$/);
  });
});

describe('Application status transitions', () => {
  const all = Object.values(ApplicationStatus);

  it('allows only PENDING -> ACCEPTED | REJECTED | WITHDRAWN', () => {
    for (const from of all) {
      for (const to of all) {
        const allowed =
          from === ApplicationStatus.PENDING &&
          to !== ApplicationStatus.PENDING;
        if (allowed) {
          expect(() => assertApplicationTransition(from, to)).not.toThrow();
        } else {
          expect(() => assertApplicationTransition(from, to)).toThrow(
            BadRequestException,
          );
        }
      }
    }
  });

  const application = (status: ApplicationStatus) => ({
    id: 'application-1',
    status,
    applicant: { id: 'influencer-user', email: 'creator@example.test' },
    order: {
      id: 'order-1',
      title: 'Brief',
      brand: { user: { id: 'brand-user', email: 'brand@example.test' } },
    },
  });

  const setup = (stored: ApplicationStatus, locked = stored) => {
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'order-1', status: OrderStatus.OPEN })
        .mockResolvedValueOnce({ id: 'application-1', status: locked })
        .mockResolvedValue(null),
      save: jest.fn(),
      update: jest.fn(),
      create: jest.fn((_entity, data) => data),
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue(application(stored)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn((entity) => entity),
    };
    const dealsService = {
      createForAcceptedApplication: jest.fn().mockResolvedValue({
        id: 'deal-1',
      }),
    };
    const service = new OrderApplicationsService(
      repository as any,
      {} as any,
      dealsService as any,
      {
        findByUserId: jest.fn().mockResolvedValue({ id: 'influencer-profile' }),
      } as any,
      {
        create: jest.fn().mockResolvedValue({ id: 'chat-1' }),
        addMessage: jest.fn(),
      } as any,
      planStub() as any,
      filesStub() as any,
      { transaction: jest.fn((work) => work(manager)) } as any,
    );
    return { service, manager, repository, dealsService };
  };

  it('accept locks and re-reads the application, then rejects only pending others', async () => {
    const { service, manager, dealsService } = setup(ApplicationStatus.PENDING);

    const result = await service.update(
      'application-1',
      'brand-user',
      UserRole.BRAND,
      { status: ApplicationStatus.ACCEPTED },
    );

    expect(result.status).toBe(ApplicationStatus.ACCEPTED);
    expect(manager.findOne).toHaveBeenNthCalledWith(
      2,
      OrderApplication,
      expect.objectContaining({
        where: { id: 'application-1' },
        lock: { mode: 'pessimistic_write' },
      }),
    );
    expect(manager.update).toHaveBeenCalledWith(
      OrderApplication,
      expect.objectContaining({ status: ApplicationStatus.PENDING }),
      { status: ApplicationStatus.REJECTED },
    );
    expect(dealsService.createForAcceptedApplication).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.IN_PROGRESS,
      }),
      expect.objectContaining({
        id: 'application-1',
        status: ApplicationStatus.ACCEPTED,
      }),
      'influencer-profile',
    );
    expect(result.dealId).toBe('deal-1');
  });

  it('accept fails if the locked row was withdrawn concurrently', async () => {
    const { service, manager, dealsService } = setup(
      ApplicationStatus.PENDING,
      ApplicationStatus.WITHDRAWN,
    );

    await expect(
      service.update('application-1', 'brand-user', UserRole.BRAND, {
        status: ApplicationStatus.ACCEPTED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
    expect(dealsService.createForAcceptedApplication).not.toHaveBeenCalled();
  });

  it.each([
    ['message', { message: 'Rewritten by admin' }],
    ['proposed price', { proposedPrice: 1 }],
    ['zero price', { proposedPrice: 0 }],
  ])('admin cannot edit the %s', async (_label, dto) => {
    const { service, repository } = setup(ApplicationStatus.PENDING);

    await expect(
      service.update('application-1', 'admin-user', UserRole.ADMIN, dto),
    ).rejects.toMatchObject({
      response: { code: 'APPLICATION_ACTION_FORBIDDEN' },
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it.each([
    [
      'PATCH accept',
      (s: OrderApplicationsService) =>
        s.update('application-1', 'brand-user', UserRole.BRAND, {
          status: ApplicationStatus.ACCEPTED,
        }),
    ],
    [
      'PATCH reject',
      (s: OrderApplicationsService) =>
        s.update('application-1', 'brand-user', UserRole.BRAND, {
          status: ApplicationStatus.REJECTED,
        }),
    ],
    [
      'DELETE (withdraw)',
      (s: OrderApplicationsService) =>
        s.withdraw('application-1', 'influencer-user'),
    ],
    [
      'GET /:id',
      (s: OrderApplicationsService) =>
        s.findOne('application-1', {
          id: 'brand-user',
          role: UserRole.BRAND,
        }),
    ],
  ])('%s returns no email', async (_route, call) => {
    const { service } = setup(ApplicationStatus.PENDING);
    const body = JSON.stringify(await call(service));
    expect(body).toContain('influencer-user');
    expect(body).not.toContain('@example.test');
  });

  it.each([
    ['brand', UserRole.BRAND, 'brand-user'],
    ['admin', UserRole.ADMIN, 'admin-user'],
  ])(
    '%s cannot change an accepted application',
    async (_label, role, userId) => {
      const { service, repository } = setup(ApplicationStatus.ACCEPTED);

      await expect(
        service.update('application-1', userId, role, {
          status: ApplicationStatus.REJECTED,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );

  it('brand cannot withdraw an application on the influencer’s behalf', async () => {
    const { service } = setup(ApplicationStatus.PENDING);

    await expect(
      service.update('application-1', 'brand-user', UserRole.BRAND, {
        status: ApplicationStatus.WITHDRAWN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reject is a compare-and-set from PENDING', async () => {
    const { service, repository } = setup(ApplicationStatus.PENDING);

    await service.update('application-1', 'brand-user', UserRole.BRAND, {
      status: ApplicationStatus.REJECTED,
    });

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'application-1', status: In([ApplicationStatus.PENDING]) },
      { status: ApplicationStatus.REJECTED },
    );
  });

  it('withdraw returns 409 when the row is no longer pending', async () => {
    const { service, repository } = setup(ApplicationStatus.PENDING);
    repository.update.mockResolvedValueOnce({ affected: 0 });

    await expect(
      service.withdraw('application-1', 'influencer-user'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('withdraw of a non-pending application is a 400', async () => {
    const { service, repository } = setup(ApplicationStatus.ACCEPTED);

    await expect(
      service.withdraw('application-1', 'influencer-user'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('OrderApplicationsService applicant ranking', () => {
  const creator = (id: string, categories: string[], rate = 0) => ({
    id,
    name: id,
    email: `${id}@example.test`,
    profile: {
      id: `${id}-profile`,
      displayName: id,
      categories,
      languages: ['ru'],
      contentTypes: [],
      metrics: { averageEngagementRate: rate },
      followersCount: 0,
    },
  });
  const app = (id: string, user: object, createdAt: string, extra = {}) => ({
    id,
    status: ApplicationStatus.PENDING,
    message: 'Pitch',
    proposedPrice: null,
    shortlisted: false,
    createdAt: new Date(createdAt),
    applicant: user,
    ...extra,
  });
  // The brief targets Food; the brand profile itself says Fashion.
  const order = {
    id: 'order-1',
    category: 'Food',
    languages: [],
    brand: {
      user: { id: 'brand-user' },
      categories: ['Fashion'],
      languages: ['ru'],
      contentTypes: [],
    },
  };
  const serviceWith = (
    applications: object[],
    plan = Plan.FREE,
    files = filesStub(),
  ) => {
    const repository = { find: jest.fn().mockResolvedValue(applications) };
    const planService = planStub(plan);
    const service = new OrderApplicationsService(
      repository as any,
      { findOne: jest.fn().mockResolvedValue(order) } as any,
      {} as any,
      {} as any,
      {} as any,
      planService as any,
      files as any,
      {} as any,
    );
    return { service, repository, planService };
  };

  it('ranks by the brief targeting, then oldest first, and pages after ranking', async () => {
    const { service } = serviceWith([
      app('fashion', creator('fashion', ['Fashion']), '2026-10-01'),
      app('food-late', creator('food-late', ['Food']), '2026-10-03'),
      app('food-early', creator('food-early', ['Food']), '2026-10-02'),
      app('food-engaged', creator('food-engaged', ['Food'], 10), '2026-10-04'),
    ]);

    const first = await service.findByOrder('order-1', 'brand-user', {
      take: 3,
      skip: 0,
    });
    expect(first.items.map((a) => a.id)).toEqual([
      'food-engaged',
      'food-early',
      'food-late',
    ]);
    expect(first.total).toBe(4);
    expect(first.items[0].score.total).toBeGreaterThan(
      first.items[1].score.total,
    );

    const second = await service.findByOrder('order-1', 'brand-user', {
      take: 3,
      skip: 3,
    });
    expect(second.items.map((a) => a.id)).toEqual(['fashion']);
    expect(JSON.stringify(second)).not.toContain('@example.test');
  });

  it('filters the shortlist and leaves withdrawn applications out', async () => {
    const { service, repository } = serviceWith([]);
    await service.findByOrder('order-1', 'brand-user', {
      take: 20,
      skip: 0,
      shortlisted: true,
    });
    const where = repository.find.mock.calls[0][0].where;
    expect(where.shortlisted).toBe(true);
    expect(where.status).toEqual(
      expect.objectContaining({ _value: ApplicationStatus.WITHDRAWN }),
    );
  });

  it('refuses verified-only results to a Free brand before reading applicants', async () => {
    const { service, repository, planService } = serviceWith([], Plan.FREE);
    await expect(
      service.findByOrder('order-1', 'brand-user', {
        take: 20,
        skip: 0,
        verifiedOnly: true,
      }),
    ).rejects.toMatchObject({
      status: 403,
      response: expect.objectContaining({
        code: ErrorCode.PLAN_PRO_REQUIRED,
      }),
    });
    expect(planService.forUser).toHaveBeenCalledWith('brand-user');
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('gives a Pro brand only verified creators', async () => {
    const { service, repository } = serviceWith([], Plan.PRO);
    await service.findByOrder('order-1', 'brand-user', {
      take: 20,
      skip: 0,
      verifiedOnly: true,
    });
    const where = repository.find.mock.calls[0][0].where;
    expect(where.applicant.profile.verifiedAt).toEqual(
      expect.objectContaining({ _type: 'not' }),
    );
  });

  it('does not check the plan without the filter', async () => {
    const { service, repository, planService } = serviceWith([], Plan.FREE);
    await service.findByOrder('order-1', 'brand-user', { take: 20, skip: 0 });
    expect(planService.forUser).not.toHaveBeenCalled();
    expect(repository.find.mock.calls[0][0].where.applicant).toBeUndefined();
  });

  it('adds the verified flag and portfolio ids to each creator', async () => {
    const verified = creator('verified', ['Food']);
    Object.assign(verified.profile, { verifiedAt: new Date('2026-10-01') });
    const files = filesStub();
    files.portfolioIdsFor.mockResolvedValue(
      new Map([['verified', ['img-1', 'img-2']]]),
    );
    const { service } = serviceWith(
      [
        app('a1', verified, '2026-10-01'),
        app('a2', creator('plain', ['Food']), '2026-10-02'),
      ],
      Plan.FREE,
      files,
    );
    const page = await service.findByOrder('order-1', 'brand-user', {
      take: 20,
      skip: 0,
    });
    expect(files.portfolioIdsFor).toHaveBeenCalledWith(['verified', 'plain']);
    expect(
      page.items.map((a) => [a.creator.verified, a.creator.portfolio]),
    ).toEqual([
      [true, ['img-1', 'img-2']],
      [false, []],
    ]);
  });

  it("refuses another brand's applicants", async () => {
    const { service } = serviceWith([]);
    await expect(
      service.findByOrder('order-1', 'other-brand', { take: 20, skip: 0 }),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('OrderApplicationsService.setShortlisted', () => {
  const serviceWith = (affected: number) => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'application-1',
        status: ApplicationStatus.PENDING,
        applicant: { id: 'creator-user' },
        order: { id: 'order-1', brand: { user: { id: 'brand-user' } } },
      }),
      update: jest.fn().mockResolvedValue({ affected }),
    };
    const service = new OrderApplicationsService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      planStub() as any,
      filesStub() as any,
      {} as any,
    );
    return { service, repository };
  };

  it('lets the owning brand shortlist a pending application', async () => {
    const { service, repository } = serviceWith(1);
    await expect(
      service.setShortlisted('application-1', 'brand-user', true),
    ).resolves.toEqual({ id: 'application-1', shortlisted: true });
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'application-1', status: ApplicationStatus.PENDING },
      { shortlisted: true },
    );
  });

  it('refuses another brand', async () => {
    const { service, repository } = serviceWith(1);
    await expect(
      service.setShortlisted('application-1', 'other-brand', true),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('refuses an application that is no longer pending', async () => {
    const { service } = serviceWith(0);
    await expect(
      service.setShortlisted('application-1', 'brand-user', true),
    ).rejects.toThrow(BadRequestException);
  });
});
