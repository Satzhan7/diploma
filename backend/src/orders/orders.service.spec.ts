import { ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus } from './entities/order.entity';
import { UserRole } from '../users/entities/user.entity';

describe('OrdersService profile-backed ownership', () => {
  it('resolves the authenticated user to a profile before listing assigned orders', async () => {
    const orderRepository = { find: jest.fn().mockResolvedValue([]) };
    const profilesService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'influencer-profile-1' }),
    };
    const service = new OrdersService(
      orderRepository as any,
      profilesService as any,
      {} as any,
    );

    await service.findByInfluencer('influencer-user-1');

    expect(profilesService.findByUserId).toHaveBeenCalledWith(
      'influencer-user-1',
    );
    expect(orderRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { influencerId: 'influencer-profile-1' },
      }),
    );
  });
});

describe('OrdersService.findOne access control', () => {
  const brandUser = {
    id: 'brand-user',
    name: 'Brand',
    email: 'brand@example.test',
    role: 'brand',
  };
  const influencerUser = {
    id: 'influencer-user',
    name: 'Influencer',
    email: 'influencer@example.test',
    role: 'influencer',
  };
  const order = (status: OrderStatus) => ({
    id: 'order-1',
    title: 'Brief',
    status,
    brandId: 'brand-profile',
    brand: { id: 'brand-profile', user: brandUser },
    influencerId: status === OrderStatus.OPEN ? null : 'influencer-profile',
    influencer:
      status === OrderStatus.OPEN
        ? null
        : { id: 'influencer-profile', user: influencerUser },
  });
  const serviceFor = (status: OrderStatus, applied = false) =>
    new OrdersService(
      { findOne: jest.fn().mockResolvedValue(order(status)) } as any,
      {} as any,
      {
        getRepository: () => ({
          exists: jest.fn().mockResolvedValue(applied),
        }),
      } as any,
    );
  const stranger = { id: 'other-user', role: UserRole.INFLUENCER };

  it.each([
    ['owning brand', { id: 'brand-user', role: UserRole.BRAND }],
    [
      'assigned influencer',
      { id: 'influencer-user', role: UserRole.INFLUENCER },
    ],
    ['admin', { id: 'admin-user', role: UserRole.ADMIN }],
  ])(
    'returns the full order without emails to the %s',
    async (_label, viewer) => {
      const result = (await serviceFor(OrderStatus.IN_PROGRESS).findOne(
        'order-1',
        viewer,
      )) as any;
      expect(result.influencer.user).toEqual(
        expect.objectContaining({ id: 'influencer-user', name: 'Influencer' }),
      );
      expect(result.brand.user.id).toBe('brand-user');
      expect(JSON.stringify(result)).not.toContain('@example.test');
    },
  );

  it('keeps the brief visible to an applicant after it leaves OPEN', async () => {
    for (const status of [
      OrderStatus.IN_PROGRESS,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ]) {
      const result = await serviceFor(status, true).findOne(
        'order-1',
        stranger,
      );
      expect(result.id).toBe('order-1');
      expect(result).not.toHaveProperty('influencer');
      expect(JSON.stringify(result)).not.toContain('@example.test');
    }
  });

  it('returns 403 to another user when the order is not open', async () => {
    for (const status of [
      OrderStatus.DRAFT,
      OrderStatus.IN_PROGRESS,
      OrderStatus.REVIEW,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ]) {
      const error = await serviceFor(status)
        .findOne('order-1', stranger)
        .catch((e) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect(error.getStatus()).toBe(403);
    }
  });

  it('returns a public projection of an open order without emails', async () => {
    const result = await serviceFor(OrderStatus.OPEN).findOne(
      'order-1',
      stranger,
    );

    expect(result.brand.user).toEqual(
      expect.objectContaining({ id: 'brand-user', name: 'Brand' }),
    );
    expect(JSON.stringify(result)).not.toContain('@example.test');
    expect(result).not.toHaveProperty('influencer');
  });
});

describe('OrdersService participant lists', () => {
  const withEmail = (id: string) => ({
    id,
    name: id,
    email: `${id}@example.test`,
    password: '$2b$10$hash',
  });
  const orders = () => [
    {
      id: 'order-1',
      brand: { id: 'brand-profile', user: withEmail('brand-user') },
      influencer: { id: 'creator-profile', user: withEmail('creator-user') },
      applications: [
        { id: 'application-1', applicant: withEmail('creator-user') },
        { id: 'application-2', applicant: withEmail('other-creator') },
      ],
    },
  ];
  const service = () =>
    new OrdersService(
      { find: jest.fn().mockResolvedValue(orders()) } as any,
      { findByUserId: jest.fn().mockResolvedValue({ id: 'profile' }) } as any,
      {} as any,
    );

  it.each([
    ['GET /orders/brand', (s: OrdersService) => s.findByBrand('brand-user')],
    [
      'GET /orders/influencer',
      (s: OrdersService) => s.findByInfluencer('creator-user'),
    ],
  ])('%s returns no email', async (_route, call) => {
    const body = JSON.stringify(await call(service()));
    expect(body).toContain('other-creator');
    expect(body).not.toMatch(/email|password|\$2b\$/);
  });
});
