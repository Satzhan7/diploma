import { OrdersService } from './orders.service';

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
