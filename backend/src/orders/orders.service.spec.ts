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
  const serviceFor = (status: OrderStatus) =>
    new OrdersService(
      { findOne: jest.fn().mockResolvedValue(order(status)) } as any,
      {} as any,
      {} as any,
    );
  const stranger = { id: 'other-user', role: UserRole.INFLUENCER };

  it.each([
    ['owning brand', { id: 'brand-user', role: UserRole.BRAND }],
    [
      'assigned influencer',
      { id: 'influencer-user', role: UserRole.INFLUENCER },
    ],
    ['admin', { id: 'admin-user', role: UserRole.ADMIN }],
  ])('returns the full order to the %s', async (_label, viewer) => {
    const result = await serviceFor(OrderStatus.IN_PROGRESS).findOne(
      'order-1',
      viewer,
    );
    expect(result).toEqual(order(OrderStatus.IN_PROGRESS));
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
