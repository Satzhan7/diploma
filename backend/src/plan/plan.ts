export enum Plan {
  FREE = 'free',
  PRO = 'pro',
}

/**
 * The plan a brand actually gets, computed on every read: the test period
 * gives everyone Pro, and Pro past `proExpiresAt` counts as Free. Nothing
 * downgrades rows on a schedule, so no cron is needed.
 */
export function effectivePlan(
  stored: { plan: Plan; proExpiresAt: Date | null },
  now: Date,
  freeTestPeriod: boolean,
): Plan {
  if (freeTestPeriod) return Plan.PRO;
  if (stored.plan !== Plan.PRO) return Plan.FREE;
  if (stored.proExpiresAt && stored.proExpiresAt.getTime() <= now.getTime()) {
    return Plan.FREE;
  }
  return Plan.PRO;
}
