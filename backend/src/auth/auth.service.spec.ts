import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { hashRefreshToken } from './refresh-token-hash';

describe('AuthService token boundaries', () => {
  const accessSecret = 'test-access-secret';
  const refreshSecret = 'test-refresh-secret';
  const user = {
    id: 'user-1',
    email: 'user@example.test',
    password: '',
    refreshToken: null as string | null,
  };

  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateRefreshToken: jest.fn(),
  };
  const profilesService = {};
  const configService = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        'jwt.secret': accessSecret,
        'jwt.refreshSecret': refreshSecret,
        'jwt.accessTokenExpiration': '15m',
        'jwt.refreshTokenExpiration': '7d',
      };
      return values[key] ?? fallback;
    }),
  };

  let jwtService: JwtService;
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    user.password = await bcrypt.hash('correct-password', 4);
    user.refreshToken = null;
    usersService.findByEmail.mockResolvedValue(user);
    usersService.findById.mockResolvedValue(user);
    usersService.updateRefreshToken.mockImplementation(
      async (_userId: string, refreshToken: string) => {
        user.refreshToken = hashRefreshToken(refreshToken);
      },
    );
    jwtService = new JwtService({ secret: accessSecret });
    service = new AuthService(
      usersService as any,
      jwtService,
      profilesService as any,
      configService as any,
    );
  });

  it('issues semantically and cryptographically separate access and refresh tokens', async () => {
    const tokens = await service.login({
      email: user.email,
      password: 'correct-password',
    });

    await expect(
      jwtService.verifyAsync(tokens.accessToken, { secret: accessSecret }),
    ).resolves.toMatchObject({ sub: user.id, tokenType: 'access' });
    await expect(
      jwtService.verifyAsync(tokens.refreshToken, { secret: refreshSecret }),
    ).resolves.toMatchObject({ sub: user.id, tokenType: 'refresh' });
    await expect(
      jwtService.verifyAsync(tokens.refreshToken, { secret: accessSecret }),
    ).rejects.toBeDefined();
  });

  it('rejects an access token at the refresh endpoint', async () => {
    const tokens = await service.login({
      email: user.email,
      password: 'correct-password',
    });

    await expect(
      service.refreshTokens(tokens.accessToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates a valid refresh token and rejects malformed or expired tokens', async () => {
    const tokens = await service.login({
      email: user.email,
      password: 'correct-password',
    });

    await expect(
      service.refreshTokens(tokens.refreshToken),
    ).resolves.toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    await expect(service.refreshTokens('not-a-jwt')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    const expired = await jwtService.signAsync(
      { sub: user.id, email: user.email, tokenType: 'refresh' },
      { secret: refreshSecret, expiresIn: '-1s' },
    );
    await expect(service.refreshTokens(expired)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a refresh token once it has been rotated out', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    try {
      const first = await service.login({
        email: user.email,
        password: 'correct-password',
      });
      // A later iat makes the next token differ only after byte 72.
      now.mockReturnValue(1_700_000_005_000);
      const second = await service.refreshTokens(first.refreshToken);

      expect(second.refreshToken).not.toBe(first.refreshToken);
      expect(first.refreshToken.slice(0, 72)).toBe(
        second.refreshToken.slice(0, 72),
      );
      await expect(
        service.refreshTokens(first.refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(
        service.refreshTokens(second.refreshToken),
      ).resolves.toMatchObject({ refreshToken: expect.any(String) });
    } finally {
      now.mockRestore();
    }
  });
});
