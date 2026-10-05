import { ProfilesService } from './profiles.service';

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

describe('ProfilesService.update and the Verified badge', () => {
  const setup = () => {
    const stored = {
      id: 'p1',
      verifiedAt: new Date('2026-10-01'),
      followersCount: 48000,
      metrics: { averageEngagementRate: 6.8 },
      socialMedia: [],
    };
    const repository = {
      findOne: jest.fn(async () => stored),
      save: jest.fn(async (profile) => profile),
    };
    return new ProfilesService(repository as any, {} as any);
  };

  it('keeps the badge when the approved stats are sent back unchanged', async () => {
    const profile = await setup().update('p1', {
      followersCount: 48000,
      bio: 'New bio',
    });
    expect(profile.verifiedAt).toEqual(new Date('2026-10-01'));
  });

  it('clears the badge when the follower count changes', async () => {
    const profile = await setup().update('p1', { followersCount: 90000 });
    expect(profile.verifiedAt).toBeNull();
  });

  it('clears the badge when the engagement rate changes', async () => {
    const profile = await setup().update('p1', {
      metrics: {
        averageEngagementRate: 9,
        averageViews: 0,
        averageLikes: 0,
        averageComments: 0,
      },
    });
    expect(profile.verifiedAt).toBeNull();
  });

  it('keeps the badge and the approved rate when metrics come without it', async () => {
    const profile = await setup().update('p1', {
      metrics: { averageViews: 5000 } as never,
    });
    expect(profile.verifiedAt).toEqual(new Date('2026-10-01'));
    expect(profile.metrics).toEqual({
      averageEngagementRate: 6.8,
      averageViews: 5000,
    });
  });
});
