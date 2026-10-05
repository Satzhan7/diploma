export enum Plan {
  FREE = 'free',
  PRO = 'pro',
}

/**
 * The plan a brand actually gets, computed on every read: Pro past
 * `proExpiresAt` counts as Free. Nothing downgrades rows on a schedule, so no
 * cron is needed. The test period does not change this: it only opens the
 * 0 ₸ checkout (PlanService.checkout), which stores a real Pro.
 */
export function effectivePlan(
  stored: { plan: Plan; proExpiresAt: Date | null },
  now: Date,
): Plan {
  if (stored.plan !== Plan.PRO) return Plan.FREE;
  if (stored.proExpiresAt && stored.proExpiresAt.getTime() <= now.getTime()) {
    return Plan.FREE;
  }
  return Plan.PRO;
}
