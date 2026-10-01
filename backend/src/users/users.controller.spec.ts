import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersController } from './users.controller';
import { UserRole } from './entities/user.entity';

describe('UsersController access control', () => {
  const guard = new RolesGuard(new Reflector());
  const contextFor = (handler: () => unknown, role: UserRole) =>
    ({
      getHandler: () => handler,
      getClass: () => UsersController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    }) as unknown as ExecutionContext;

  it('lets only admins list all users (others get 403)', () => {
    const findAll = UsersController.prototype.findAll;
    expect(guard.canActivate(contextFor(findAll, UserRole.BRAND))).toBe(false);
    expect(guard.canActivate(contextFor(findAll, UserRole.INFLUENCER))).toBe(
      false,
    );
    expect(guard.canActivate(contextFor(findAll, UserRole.ADMIN))).toBe(true);
  });

  const storedUser = {
    id: 'u1',
    name: 'Aida',
    firstName: 'Aida',
    lastName: 'K',
    email: 'aida@example.test',
    password: '$2b$10$hash',
    refreshToken: '$2b$10$refresh',
    role: UserRole.INFLUENCER,
    isEmailVerified: true,
    createdAt: new Date(),
    profile: { id: 'p1', displayName: 'Aida' },
  };

  const controller = new UsersController({
    findById: jest.fn().mockResolvedValue(storedUser),
    findInfluencers: jest.fn().mockResolvedValue([storedUser]),
    findBrands: jest.fn().mockResolvedValue([storedUser]),
  } as any);

  it.each([
    ['GET /users/:id', () => controller.findById('u1')],
    ['GET /users/influencers', () => controller.findInfluencers()],
    ['GET /users/brands', () => controller.findBrands()],
  ])('%s returns a public projection only', async (_route, call) => {
    const body = JSON.stringify(await call());
    expect(body).toContain('"id":"u1"');
    expect(body).toContain('"displayName":"Aida"');
    for (const secret of ['email', 'password', 'refreshToken', '$2b$']) {
      expect(body).not.toContain(secret);
    }
  });
});
