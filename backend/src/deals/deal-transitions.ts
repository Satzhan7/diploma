import { BadRequestException } from '@nestjs/common';
import { apiError, ErrorCode } from '../common/errors/error-codes';
import { DealStatus } from './entities/deal.entity';

// The only place deal status changes are defined. Every change, from any
// role, is checked here and then applied with a compare-and-set update.
export const DEAL_TRANSITIONS: Record<DealStatus, readonly DealStatus[]> = {
  [DealStatus.ACTIVE]: [DealStatus.PROOF_SUBMITTED, DealStatus.CANCELLED],
  [DealStatus.PROOF_SUBMITTED]: [DealStatus.COMPLETED, DealStatus.DISPUTED],
  [DealStatus.COMPLETED]: [],
  [DealStatus.DISPUTED]: [],
  [DealStatus.CANCELLED]: [],
};

export function canTransitionDeal(from: DealStatus, to: DealStatus): boolean {
  return DEAL_TRANSITIONS[from].includes(to);
}

export function assertDealTransition(from: DealStatus, to: DealStatus): void {
  if (!canTransitionDeal(from, to)) {
    throw new BadRequestException(
      apiError(
        ErrorCode.DEAL_INVALID_TRANSITION,
        `Deal cannot move from ${from} to ${to}`,
      ),
    );
  }
}

// Statuses from which `to` is reachable, for compare-and-set updates.
export function dealSourcesOf(to: DealStatus): DealStatus[] {
  return (Object.keys(DEAL_TRANSITIONS) as DealStatus[]).filter((from) =>
    canTransitionDeal(from, to),
  );
}
