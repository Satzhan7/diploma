import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderApplicationsService } from './order-applications.service';
import { OrderStatus } from './entities/order.entity';

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
