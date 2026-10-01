import { BadRequestException } from '@nestjs/common';
import { CollaborationsService } from './collaborations.service';
import { UserRole } from '../users/entities/user.entity';

describe('CollaborationsService', () => {
  const collaborationsRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'collaboration-1', ...value })),
  };
  const ordersRepository = { findOne: jest.fn() };
  const usersService = { findById: jest.fn() };
  let service: CollaborationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CollaborationsService(
      collaborationsRepository as any,
      ordersRepository as any,
      usersService as any,
    );
  });

  it('rejects a collaboration when participant roles are invalid', async () => {
    usersService.findById
      .mockResolvedValueOnce({ id: 'brand-1', role: UserRole.INFLUENCER })
      .mockResolvedValueOnce({ id: 'influencer-1', role: UserRole.INFLUENCER });

    await expect(
      service.create({ brandId: 'brand-1', influencerId: 'influencer-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires an attached order to belong to the supplied participants', async () => {
    usersService.findById
      .mockResolvedValueOnce({ id: 'brand-1', role: UserRole.BRAND })
      .mockResolvedValueOnce({ id: 'influencer-1', role: UserRole.INFLUENCER });
    ordersRepository.findOne.mockResolvedValue({
      brand: { user: { id: 'another-brand' } },
      influencer: { user: { id: 'influencer-1' } },
    });

    await expect(
      service.create({
        brandId: 'brand-1',
        influencerId: 'influencer-1',
        orderId: 'order-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a collaboration only for valid participants and their order', async () => {
    usersService.findById
      .mockResolvedValueOnce({ id: 'brand-1', role: UserRole.BRAND })
      .mockResolvedValueOnce({ id: 'influencer-1', role: UserRole.INFLUENCER });
    ordersRepository.findOne.mockResolvedValue({
      brand: { user: { id: 'brand-1' } },
      influencer: { user: { id: 'influencer-1' } },
    });

    await expect(
      service.create({
        brandId: 'brand-1',
        influencerId: 'influencer-1',
        orderId: 'order-1',
      }),
    ).resolves.toMatchObject({
      brandId: 'brand-1',
      influencerId: 'influencer-1',
    });
  });
});
