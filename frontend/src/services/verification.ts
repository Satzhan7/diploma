import api from './api';
import { imageForm, multipart } from './files';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

/** The creator's own stats claim (backend verification/verification-view.ts). */
export interface MyVerification {
  status: VerificationStatus;
  followers: number | null;
  /** Percent, e.g. 6.8. */
  engagementRate: number | null;
  screenshotId: string | null;
  rejectReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  /** Set while the Verified badge is on. */
  verifiedAt: string | null;
}

export const verificationService = {
  mine: async () => (await api.get('/verification/me')).data as MyVerification,
  submit: async (data: { followers: number; engagementRate: number; screenshot: File }) =>
    (
      await api.post(
        '/verification',
        imageForm(data.screenshot, { followers: data.followers, engagementRate: data.engagementRate }),
        multipart,
      )
    ).data as MyVerification,
};
