import { ConflictException, ForbiddenException } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchStatus } from './entities/match.entity';
import { UserRole } from '../users/entities/user.entity';

describe('MatchingService core flows', () => {
  const matchRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const usersService = {
    findById: jest.fn(),
  };
  let service: MatchingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MatchingService(
      matchRepository as any,
      usersService as any,
      {} as any,
      {} as any,
    );
  });

  it('creates an interest only for valid brand and influencer identities', async () => {
    usersService.findById.mockImplementation(async (id: string) => {
      if (id === 'brand-1') return { id, role: UserRole.BRAND };
      if (id === 'influencer-1') return { id, role: UserRole.INFLUENCER };
      return null;
    });
    matchRepository.findOne.mockResolvedValue(null);
    matchRepository.create.mockImplementation((value) => value);
    matchRepository.save.mockImplementation(async (value) => ({
      id: 'match-1',
      ...value,
    }));

    await expect(
      service.expressInterest('brand-1', 'influencer-1'),
    ).resolves.toMatchObject({
      brandId: 'brand-1',
      influencerId: 'influencer-1',
      status: MatchStatus.PENDING,
    });
  });

  it('rejects a duplicate interest', async () => {
    usersService.findById
      .mockResolvedValueOnce({ role: UserRole.BRAND })
      .mockResolvedValueOnce({ role: UserRole.INFLUENCER });
    matchRepository.findOne.mockResolvedValue({ id: 'existing-match' });

    await expect(
      service.expressInterest('brand-1', 'influencer-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows only the owning brand to complete an accepted match', async () => {
    const match = {
      id: 'match-1',
      brandId: 'brand-1',
      influencerId: 'influencer-1',
      status: MatchStatus.ACCEPTED,
    };
    matchRepository.findOne.mockResolvedValue(match);
    matchRepository.save.mockImplementation(async (value) => value);

    await expect(
      service.completeMatch('match-1', 'influencer-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.completeMatch('match-1', 'brand-1'),
    ).resolves.toMatchObject({
      status: MatchStatus.COMPLETED,
    });
  });
});
