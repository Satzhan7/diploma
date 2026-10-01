import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersService } from '../users/users.service';

describe('AuthController token boundary', () => {
  const accessSecret = 'test-access-secret';
  const usersService = {
    findById: jest.fn(),
  };
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    deleteAccount: jest.fn(),
  };
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.test',
      role: 'influencer',
      name: 'User',
    });
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [AuthController],
      providers: [
        JwtAuthGuard,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => accessSecret) },
        },
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    jwtService = new JwtService({ secret: accessSecret });
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts an access token and rejects refresh, malformed, and expired tokens', async () => {
    const accessToken = await jwtService.signAsync({
      sub: 'user-1',
      email: 'user@example.test',
      tokenType: 'access',
    });
    const refreshToken = await jwtService.signAsync({
      sub: 'user-1',
      email: 'user@example.test',
      tokenType: 'refresh',
    });
    const expiredToken = await jwtService.signAsync(
      { sub: 'user-1', email: 'user@example.test', tokenType: 'access' },
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({
        id: 'user-1',
        sub: 'user-1',
        email: 'user@example.test',
        role: 'influencer',
        name: 'User',
      });

    for (const token of [refreshToken, 'not-a-jwt', expiredToken]) {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    }
  });
});
