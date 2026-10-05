import { PlanService } from './plan.service';
import { Plan } from './plan';
import { AuditLog } from '../admin/entities/audit-log.entity';
import { ErrorCode } from '../common/errors/error-codes';

describe('PlanService', () => {
  const config = (freeTestPeriod: boolean) => ({
    get: jest.fn(
      (key: string) =>
        ({
          freeTestPeriod,
          'kaspi.phone': '+7 700 000 00 00',
          'kaspi.recipient': 'AdPartners',
        })[key],
    ),
  });

  // A transaction whose locked profile row is `stored`; records writes.
  const dataSourceWith = (
    stored: { id: string; plan: Plan; proExpiresAt: Date | null } | null,
  ) => {
    const query = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => stored),
    };
    const manager = {
      createQueryBuilder: jest.fn(() => query),
      update: jest.fn(async () => undefined),
      insert: jest.fn(async () => undefined),
    };
    const dataSource = {
      transaction: jest.fn(async (work: (m: typeof manager) => unknown) =>
        work(manager),
      ),
    };
    return { dataSource, manager, query };
  };

  it('reads the stored plan on every call, so an admin change applies at once', async () => {
    const profiles = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ plan: Plan.FREE, proExpiresAt: null })
        .mockResolvedValueOnce({ plan: Plan.PRO, proExpiresAt: null }),
    };
    const service = new PlanService(
      profiles as any,
      config(false) as any,
      {} as any,
    );
    await expect(service.forUser('brand')).resolves.toMatchObject({
      plan: Plan.FREE,
      freeTestPeriod: false,
      priceKzt: 19900,
    });
    await expect(service.forUser('brand')).resolves.toMatchObject({
      plan: Plan.PRO,
    });
    expect(profiles.findOne).toHaveBeenCalledTimes(2);
  });

  it.each([
    [true, 0],
    [false, null],
  ])(
    'FREE_TEST_PERIOD=%p leaves a stored-Free brand Free (checkout price %p)',
    async (flag, checkoutPriceKzt) => {
      const profiles = {
        findOne: jest.fn(async () => ({ plan: Plan.FREE, proExpiresAt: null })),
      };
      const service = new PlanService(
        profiles as any,
        config(flag) as any,
        {} as any,
      );
      await expect(service.forUser('brand')).resolves.toEqual({
        plan: Plan.FREE,
        storedPlan: Plan.FREE,
        proExpiresAt: null,
        freeTestPeriod: flag,
        priceKzt: 19900,
        checkoutPriceKzt,
        kaspiPhone: '+7 700 000 00 00',
        kaspiRecipient: 'AdPartners',
      });
    },
  );

  it('answers 404 without a profile', async () => {
    const service = new PlanService(
      { findOne: jest.fn(async () => null) } as any,
      config(false) as any,
      {} as any,
    );
    await expect(service.forUser('nobody')).rejects.toMatchObject({
      status: 404,
    });
  });

  describe('checkout', () => {
    it('gives Pro for 30 days at 0 ₸ in the test period and writes the audit row', async () => {
      const { dataSource, manager, query } = dataSourceWith({
        id: 'profile-1',
        plan: Plan.FREE,
        proExpiresAt: null,
      });
      const service = new PlanService(
        {} as any,
        config(true) as any,
        dataSource as any,
      );
      const before = Date.now();
      const view = await service.checkout('brand-user');

      expect(query.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(query.where).toHaveBeenCalledWith('profile.user_id = :userId', {
        userId: 'brand-user',
      });
      expect(view).toMatchObject({
        plan: Plan.PRO,
        storedPlan: Plan.PRO,
        freeTestPeriod: true,
        priceKzt: 19900,
        checkoutPriceKzt: 0,
      });
      const days = (view.proExpiresAt!.getTime() - before) / 86_400_000;
      expect(days).toBeGreaterThanOrEqual(30);
      expect(days).toBeLessThan(30.01);
      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        'profile-1',
        { plan: Plan.PRO, proExpiresAt: view.proExpiresAt },
      );
      expect(manager.insert).toHaveBeenCalledWith(AuditLog, {
        actorId: 'brand-user',
        action: 'plan.checkout',
        targetType: 'profile',
        targetId: 'profile-1',
        details: { priceKzt: 0, proExpiresAt: view.proExpiresAt },
      });
    });

    it('lets a brand whose Pro expired check out again', async () => {
      const { dataSource } = dataSourceWith({
        id: 'profile-1',
        plan: Plan.PRO,
        proExpiresAt: new Date(Date.now() - 1000),
      });
      const service = new PlanService(
        {} as any,
        config(true) as any,
        dataSource as any,
      );
      await expect(service.checkout('brand-user')).resolves.toMatchObject({
        plan: Plan.PRO,
      });
    });

    it.each([
      ['without expiry', null],
      ['not yet expired', new Date(Date.now() + 86_400_000)],
    ])(
      'answers 409 PLAN_ALREADY_PRO for Pro %s, writing nothing',
      async (_label, proExpiresAt) => {
        const { dataSource, manager } = dataSourceWith({
          id: 'profile-1',
          plan: Plan.PRO,
          proExpiresAt,
        });
        const service = new PlanService(
          {} as any,
          config(true) as any,
          dataSource as any,
        );
        await expect(service.checkout('brand-user')).rejects.toMatchObject({
          status: 409,
          response: expect.objectContaining({
            code: ErrorCode.PLAN_ALREADY_PRO,
          }),
        });
        expect(manager.update).not.toHaveBeenCalled();
        expect(manager.insert).not.toHaveBeenCalled();
      },
    );

    it('answers 409 PLAN_CHECKOUT_UNAVAILABLE outside the test period, before any query', async () => {
      const { dataSource } = dataSourceWith({
        id: 'profile-1',
        plan: Plan.FREE,
        proExpiresAt: null,
      });
      const service = new PlanService(
        {} as any,
        config(false) as any,
        dataSource as any,
      );
      await expect(service.checkout('brand-user')).rejects.toMatchObject({
        status: 409,
        response: expect.objectContaining({
          code: ErrorCode.PLAN_CHECKOUT_UNAVAILABLE,
        }),
      });
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('answers 404 without a profile', async () => {
      const { dataSource } = dataSourceWith(null);
      const service = new PlanService(
        {} as any,
        config(true) as any,
        dataSource as any,
      );
      await expect(service.checkout('nobody')).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
