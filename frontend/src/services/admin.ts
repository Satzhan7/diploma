import api from './api';
import type { Page, PageParams } from './page';
import type { Plan, PlanInfo } from './plan';

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface AdminVerification {
  id: string;
  status: ClaimStatus;
  followers: number;
  engagementRate: number;
  screenshotId: string | null;
  rejectReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  creator: {
    userId: string;
    profileId: string;
    name: string;
    email: string;
    followersCount: number | null;
    engagementRate: number | null;
    verifiedAt: string | null;
  };
}

export interface AdminBrand extends PlanInfo {
  profileId: string;
  userId: string;
  name: string;
  email: string;
  companyName: string | null;
}

export const adminService = {
  verifications: async (query: PageParams & { status?: ClaimStatus }): Promise<Page<AdminVerification>> =>
    (await api.get('/admin/verifications', { params: query })).data,
  /** `submittedAt` is the claim the admin looked at; a resubmission makes it 409. */
  approve: async (v: AdminVerification) =>
    (await api.post(`/admin/verifications/${v.id}/approve`, { submittedAt: v.submittedAt })).data as AdminVerification,
  reject: async (v: AdminVerification, reason: string) =>
    (await api.post(`/admin/verifications/${v.id}/reject`, { submittedAt: v.submittedAt, reason }))
      .data as AdminVerification,
  brands: async (query: PageParams & { search?: string }): Promise<Page<AdminBrand>> =>
    (await api.get('/admin/brands', { params: query })).data,
  setPlan: async (profileId: string, data: { plan: Plan; proExpiresAt: string | null }) =>
    (await api.patch(`/admin/brands/${profileId}/plan`, data)).data as AdminBrand,
};
