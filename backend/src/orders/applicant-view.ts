import { MatchProfile, MatchScore } from '../profiles/match-score';
import { Profile } from '../profiles/entities/profile.entity';
import {
  ApplicationStatus,
  OrderApplication,
} from './entities/order-application.entity';
import { Order } from './entities/order.entity';
import { BriefView, toBriefView } from './brief-view';

// A creator as a brand sees them among applicants: the public profile card.
// No email (decision D5); the two sides talk in chat after acceptance.
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
  engagementRate: number | null;
  /** Verification arrives in R4; always false until then. */
  verified: boolean;
}

export interface ApplicantView {
  id: string;
  status: ApplicationStatus;
  message: string;
  proposedPrice: number | null;
  shortlisted: boolean;
  createdAt: Date;
  score: MatchScore;
  creator: ApplicantCreator;
}

// The brief's targeting on top of the brand profile: what the brand wants
// from this brief rather than from every brief.
export function briefProfile(order: Order, brand: Profile): MatchProfile {
  return {
    categories: order.category ? [order.category] : brand.categories,
    languages: order.languages?.length ? order.languages : brand.languages,
    contentTypes: brand.contentTypes,
    metrics: brand.metrics,
    followersCount: brand.followersCount,
  };
}

export function toApplicantView(
  application: OrderApplication,
  score: MatchScore,
): ApplicantView {
  const user = application.applicant;
  const profile: Partial<Profile> = user.profile ?? {};
  const rate = Number(profile.metrics?.averageEngagementRate);
  return {
    id: application.id,
    status: application.status,
    message: application.message,
    proposedPrice: application.proposedPrice ?? null,
    shortlisted: application.shortlisted,
    createdAt: application.createdAt,
    score,
    creator: {
      userId: user.id,
      profileId: profile.id ?? null,
      name: profile.displayName || user.name,
      avatarUrl: profile.avatarUrl ?? null,
      location: profile.location ?? null,
      bio: profile.bio ?? null,
      categories: profile.categories ?? [],
      languages: profile.languages ?? [],
      contentTypes: profile.contentTypes ?? [],
      platforms: profile.socialMediaPlatforms ?? [],
      followersCount: profile.followersCount ?? null,
      engagementRate: Number.isFinite(rate) ? rate : null,
      verified: false,
    },
  };
}

// The creator's own application, with the brief it belongs to. The
// shortlist flag stays with the brand.
export interface MyApplicationView {
  id: string;
  status: ApplicationStatus;
  message: string;
  proposedPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
  order: BriefView;
}

export function toMyApplicationView(
  application: OrderApplication,
): MyApplicationView {
  return {
    id: application.id,
    status: application.status,
    message: application.message,
    proposedPrice: application.proposedPrice ?? null,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    order: toBriefView(application.order),
  };
}
