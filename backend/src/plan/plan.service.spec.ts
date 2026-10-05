import { PlanService } from './plan.service';
import { Plan } from './plan';

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

  it('reads the stored plan on every call, so an admin change applies at once', async () => {
    const profiles = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ plan: Plan.FREE, proExpiresAt: null })
        .mockResolvedValueOnce({ plan: Plan.PRO, proExpiresAt: null }),
    };
    const service = new PlanService(profiles as any, config(false) as any);
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
    [true, Plan.PRO],
    [false, Plan.FREE],
  ])(
    'FREE_TEST_PERIOD=%p gives a stored-Free brand %p',
    async (flag, expected) => {
      const profiles = {
        findOne: jest.fn(async () => ({ plan: Plan.FREE, proExpiresAt: null })),
      };
      const service = new PlanService(profiles as any, config(flag) as any);
      await expect(service.forUser('brand')).resolves.toEqual({
        plan: expected,
        storedPlan: Plan.FREE,
        proExpiresAt: null,
        freeTestPeriod: flag,
        priceKzt: 19900,
        kaspiPhone: '+7 700 000 00 00',
        kaspiRecipient: 'AdPartners',
      });
    },
  );

  it('answers 404 without a profile', async () => {
    const service = new PlanService(
      { findOne: jest.fn(async () => null) } as any,
      config(false) as any,
    );
    await expect(service.forUser('nobody')).rejects.toMatchObject({
      status: 404,
    });
  });
});
