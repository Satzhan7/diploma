import {
  CreatorVerification,
  VerificationStatus,
} from './entities/creator-verification.entity';

/** The creator's own view of their stats claim. */
export interface MyVerificationView {
  status: VerificationStatus | 'none';
  followers: number | null;
  engagementRate: number | null;
  screenshotId: string | null;
  rejectReason: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  verifiedAt: Date | null;
}

export function toMyVerificationView(
  row: CreatorVerification | null,
  verifiedAt: Date | null,
): MyVerificationView {
  return {
    status: row?.status ?? 'none',
    followers: row?.followers ?? null,
    engagementRate: row?.engagementRate ?? null,
    screenshotId: row?.screenshotId ?? null,
    rejectReason: row?.rejectReason ?? null,
    submittedAt: row?.submittedAt ?? null,
    reviewedAt: row?.reviewedAt ?? null,
    verifiedAt,
  };
}
