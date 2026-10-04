import { BadRequestException } from '@nestjs/common';
import {
  assertDealTransition,
  canTransitionDeal,
  dealSourcesOf,
} from './deal-transitions';
import { DealStatus } from './entities/deal.entity';

const { ACTIVE, PROOF_SUBMITTED, COMPLETED, DISPUTED, CANCELLED } = DealStatus;

const ALLOWED: Array<[DealStatus, DealStatus]> = [
  [ACTIVE, PROOF_SUBMITTED],
  [ACTIVE, CANCELLED],
  [PROOF_SUBMITTED, COMPLETED],
  [PROOF_SUBMITTED, DISPUTED],
];

const ALL = Object.values(DealStatus);
const FORBIDDEN = ALL.flatMap((from) =>
  ALL.map((to) => [from, to] as [DealStatus, DealStatus]),
).filter(([from, to]) => !ALLOWED.some(([f, t]) => f === from && t === to));

describe('deal transitions', () => {
  it('covers every pair of statuses', () => {
    expect(ALLOWED.length + FORBIDDEN.length).toBe(ALL.length * ALL.length);
  });

  it.each(ALLOWED)('allows %s → %s', (from, to) => {
    expect(canTransitionDeal(from, to)).toBe(true);
    expect(() => assertDealTransition(from, to)).not.toThrow();
  });

  it.each(FORBIDDEN)('forbids %s → %s', (from, to) => {
    expect(canTransitionDeal(from, to)).toBe(false);
    expect(() => assertDealTransition(from, to)).toThrow(BadRequestException);
    try {
      assertDealTransition(from, to);
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toMatchObject({
        code: 'DEAL_INVALID_TRANSITION',
      });
    }
  });

  it('lists the sources of each target for compare-and-set', () => {
    expect(dealSourcesOf(PROOF_SUBMITTED)).toEqual([ACTIVE]);
    expect(dealSourcesOf(CANCELLED)).toEqual([ACTIVE]);
    expect(dealSourcesOf(COMPLETED)).toEqual([PROOF_SUBMITTED]);
    expect(dealSourcesOf(DISPUTED)).toEqual([PROOF_SUBMITTED]);
    expect(dealSourcesOf(ACTIVE)).toEqual([]);
  });
});
