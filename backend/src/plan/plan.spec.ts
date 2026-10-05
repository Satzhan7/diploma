import { effectivePlan, Plan } from './plan';

describe('effectivePlan', () => {
  const now = new Date('2026-10-05T12:00:00Z');
  const later = new Date('2026-11-05T12:00:00Z');
  const earlier = new Date('2026-10-05T11:59:59Z');

  it('gives every brand Pro during the test period', () => {
    expect(
      effectivePlan({ plan: Plan.FREE, proExpiresAt: null }, now, true),
    ).toBe(Plan.PRO);
    expect(
      effectivePlan({ plan: Plan.PRO, proExpiresAt: earlier }, now, true),
    ).toBe(Plan.PRO);
  });

  it('keeps Free as Free outside the test period', () => {
    expect(
      effectivePlan({ plan: Plan.FREE, proExpiresAt: later }, now, false),
    ).toBe(Plan.FREE);
  });

  it('keeps Pro until it expires', () => {
    expect(
      effectivePlan({ plan: Plan.PRO, proExpiresAt: null }, now, false),
    ).toBe(Plan.PRO);
    expect(
      effectivePlan({ plan: Plan.PRO, proExpiresAt: later }, now, false),
    ).toBe(Plan.PRO);
  });

  it('counts expired Pro as Free, from the expiry instant on', () => {
    expect(
      effectivePlan({ plan: Plan.PRO, proExpiresAt: earlier }, now, false),
    ).toBe(Plan.FREE);
    expect(
      effectivePlan({ plan: Plan.PRO, proExpiresAt: now }, now, false),
    ).toBe(Plan.FREE);
  });
});
