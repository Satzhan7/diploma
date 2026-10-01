import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const usersService = {
    findById: jest.fn(),
  };
  const configService = {
    get: jest.fn(() => 'test-access-secret'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.test',
      role: 'influencer',
      name: 'User',
    });
  });

  it('returns minimal claims for an access token payload', async () => {
    const strategy = new JwtStrategy(configService as any, usersService as any);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.test',
        tokenType: 'access',
      }),
    ).resolves.toEqual({
      id: 'user-1',
      sub: 'user-1',
      email: 'user@example.test',
      role: 'influencer',
      name: 'User',
    });
  });

  it('rejects refresh-token payloads before user lookup', async () => {
    const strategy = new JwtStrategy(configService as any, usersService as any);

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user@example.test',
        tokenType: 'refresh',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findById).not.toHaveBeenCalled();
  });
});
