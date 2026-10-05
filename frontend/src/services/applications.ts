import api from './api';
import type { Page, PageParams } from './page';
import type { ApplicationStatus, Brief } from './briefs';

/** The match parts are 0–1; `total` is 0–100 (backend profiles/match-score.ts). */
export interface MatchScore {
  categoryMatch: number;
  audienceMatch: number;
  engagementScore: number;
  total: number;
}

/** A creator as a brand sees them among applicants. Never an email (D5). */
export interface ApplicantCreator {
  userId: string;
  profileId: string | null;
  name: string;
  avatarUrl: string | null;
  location: string | null;
  bio: string | null;
  categories: string[];
  languages: string[];
  contentTypes: string[];
  platforms: string[];
  followersCount: number | null;
  /** Percent, e.g. 6.8. */
  engagementRate: number | null;
  verified: boolean;
}

export interface Applicant {
  id: string;
  status: ApplicationStatus;
  message: string;
  proposedPrice: number | null;
  shortlisted: boolean;
  createdAt: string;
  score: MatchScore;
  creator: ApplicantCreator;
}

/** The creator's own application with its brief. */
export interface MyApplication {
  id: string;
  status: ApplicationStatus;
  message: string;
  proposedPrice: number | null;
  createdAt: string;
  updatedAt: string;
  order: Brief;
}

export interface ApplicantParams extends PageParams {
  shortlisted?: boolean;
}

export const applicationsService = {
  apply: async (briefId: string, data: { message: string; proposedPrice?: number }) =>
    (await api.post(`/order-applications/${briefId}`, data)).data as { id: string },
  mine: async (query: PageParams = {}): Promise<Page<MyApplication>> =>
    (await api.get('/order-applications', { params: query })).data,
  /** Applicants of a brief, best match first. */
  forBrief: async (briefId: string, query: ApplicantParams = {}): Promise<Page<Applicant>> =>
    (await api.get(`/order-applications/order/${briefId}`, { params: query })).data,
  shortlist: async (id: string, shortlisted: boolean) =>
    (await api.patch(`/order-applications/${id}/shortlist`, { shortlisted })).data as {
      id: string;
      shortlisted: boolean;
    },
  /** Accepting creates the deal (docs/adr/0001-deal-pipeline.md). */
  decide: async (id: string, status: 'accepted' | 'rejected') =>
    (await api.patch(`/order-applications/${id}`, { status })).data as {
      id: string;
      status: ApplicationStatus;
      dealId?: string;
    },
  withdraw: async (id: string) => (await api.delete(`/order-applications/${id}`)).data as { id: string },
};
