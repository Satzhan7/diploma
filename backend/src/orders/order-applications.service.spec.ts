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
import {
  ApplicationStatus,
  OrderApplication,
} from './entities/order-application.entity';
import { UserRole } from '../users/entities/user.entity';

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
      find: jest.fn().mockResolvedValue([
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
      ]),
    };
    const service = new OrderApplicationsService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const [application] = await service.findAllByUser('influencer-1');

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: ['order', 'order.brand', 'order.brand.user'],
      }),
    );
    expect(application.order.brand.user.id).toBe('brand-user');
    expect(JSON.stringify(application)).not.toMatch(/email|password|\$2b\$/);
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
    applicant: { id: 'influencer-user' },
    order: {
      id: 'order-1',
      title: 'Brief',
      brand: { user: { id: 'brand-user' } },
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
    const service = new OrderApplicationsService(
      repository as any,
      {} as any,
      {} as any,
      {
        findByUserId: jest.fn().mockResolvedValue({ id: 'influencer-profile' }),
      } as any,
      {
        create: jest.fn().mockResolvedValue({ id: 'chat-1' }),
        addMessage: jest.fn(),
      } as any,
      { transaction: jest.fn((work) => work(manager)) } as any,
    );
    return { service, manager, repository };
  };

  it('accept locks and re-reads the application, then rejects only pending others', async () => {
    const { service, manager } = setup(ApplicationStatus.PENDING);

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
  });

  it('accept fails if the locked row was withdrawn concurrently', async () => {
    const { service, manager } = setup(
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
