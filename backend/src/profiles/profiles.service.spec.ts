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
    await service.findInfluencersByCategories(['fashion']);
    await service.findBrandsByCategories(['beauty']);

    const conditions = queryBuilder.andWhere.mock.calls.map(
      ([condition]) => condition,
    );
    expect(conditions).toEqual(
      expect.arrayContaining([expect.stringContaining('string_to_array')]),
    );
    expect(conditions.join(' ')).not.toContain('profile.productCategories');
  });
});
