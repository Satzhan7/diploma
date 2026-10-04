import { ProfilesService } from './profiles.service';

describe('ProfilesService simple-array filters', () => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
  const repository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses PostgreSQL-compatible string_to_array predicates for documented filters', async () => {
    const service = new ProfilesService(repository as any, {} as any);
    jest
      .spyOn(service, 'findByUserId')
      .mockResolvedValue({ id: 'brand-profile' } as any);

    await service.findInfluencersForBrand('brand-user', {
      niches: ['fashion'],
      platforms: ['instagram'],
      contentTypes: ['reel'],
    });

    const conditions = queryBuilder.andWhere.mock.calls.map(
      ([condition]) => condition,
    );
    expect(conditions).toEqual(
      expect.arrayContaining([expect.stringContaining('string_to_array')]),
    );
    expect(conditions.join(' ')).not.toContain('profile.productCategories');
  });
});

describe('ProfilesService.findPublicByUserId', () => {
  it('returns the profile with its owner as a public user (no email or hashes)', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'profile-1',
        displayName: 'Aida',
        socialMedia: [],
        user: {
          id: 'user-1',
          name: 'Aida',
          role: 'influencer',
          email: 'aida@example.test',
          password: '$2b$10$hash',
          refreshToken: '$2b$10$refresh',
        },
      }),
    };
    const service = new ProfilesService(repository as any, {} as any);

    const profile = await service.findPublicByUserId('user-1');

    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ relations: ['socialMedia', 'user'] }),
    );
    expect(profile.user).toEqual(
      expect.objectContaining({ id: 'user-1', role: 'influencer' }),
    );
    const body = JSON.stringify(profile);
    for (const secret of ['email', 'password', 'refreshToken', '$2b$']) {
      expect(body).not.toContain(secret);
    }
  });
});

describe('ProfilesService search results', () => {
  it.each([
    ['influencers for a brand', 'findInfluencersForBrand'],
    ['brands for an influencer', 'findBrandsForInfluencer'],
  ] as const)('%s carry a public user only', async (_label, method) => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'profile-2',
          user: {
            id: 'user-2',
            name: 'Other',
            role: 'influencer',
            email: 'other@example.test',
            password: '$2b$10$hash',
          },
        },
      ]),
    };
    const service = new ProfilesService(
      { createQueryBuilder: jest.fn(() => queryBuilder) } as any,
      {} as any,
    );
    jest
      .spyOn(service, 'findByUserId')
      .mockResolvedValue({ id: 'my-profile' } as any);

    const [profile] = await service[method]('user-1', {});

    expect(profile.user.id).toBe('user-2');
    expect(JSON.stringify(profile)).not.toMatch(/email|password|\$2b\$/);
  });
});
