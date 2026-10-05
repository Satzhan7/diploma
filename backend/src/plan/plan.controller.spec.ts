import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { PlanController } from './plan.controller';

describe('PlanController access control', () => {
  const guard = new RolesGuard(new Reflector());
  const contextFor = (handler: (...args: never[]) => unknown, role: UserRole) =>
    ({
      getHandler: () => handler,
      getClass: () => PlanController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    }) as unknown as ExecutionContext;

  it.each([
    ['GET /plan/me', PlanController.prototype.mine],
    ['POST /plan/checkout', PlanController.prototype.checkout],
  ])('lets only brands use %s (a creator gets 403)', (_route, handler) => {
    expect(guard.canActivate(contextFor(handler, UserRole.BRAND))).toBe(true);
    expect(guard.canActivate(contextFor(handler, UserRole.INFLUENCER))).toBe(
      false,
    );
    expect(guard.canActivate(contextFor(handler, UserRole.ADMIN))).toBe(false);
  });
});
