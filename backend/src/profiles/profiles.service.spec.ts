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
