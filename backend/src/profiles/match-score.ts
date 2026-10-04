import { Profile } from './entities/profile.entity';

export type MatchProfile = Pick<
  Profile,
  'categories' | 'languages' | 'contentTypes' | 'metrics' | 'followersCount'
>;

export interface MatchScore {
  categoryMatch: number;
  audienceMatch: number;
  engagementScore: number;
  /** 0–100, rounded. */
  total: number;
}

export const MATCH_WEIGHTS = {
  categoryMatch: 0.4,
  audienceMatch: 0.3,
  engagementScore: 0.3,
} as const;

/** Engagement rate (percent) that earns the full engagement part. */
export const FULL_ENGAGEMENT_RATE = 10;
/** Follower count that earns the full follower bonus. */
export const FULL_FOLLOWERS = 100_000;

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

// Jaccard overlap of tags, case-insensitive. Symmetric; 0 when either is empty.
export function tagOverlap(a?: string[] | null, b?: string[] | null): number {
  if (!a?.length || !b?.length) return 0;
  const left = new Set(a.map((s) => s.trim().toLowerCase()));
  const right = new Set(b.map((s) => s.trim().toLowerCase()));
  let shared = 0;
  left.forEach((tag) => {
    if (right.has(tag)) shared += 1;
  });
  const union = left.size + right.size - shared;
  return union === 0 ? 0 : shared / union;
}

// Languages weigh 0.6 and content types 0.4; when one side lacks either
// list, the other list decides alone.
function audienceMatch(brand: MatchProfile, creator: MatchProfile): number {
  const hasLanguages = !!brand.languages?.length && !!creator.languages?.length;
  const hasContent =
    !!brand.contentTypes?.length && !!creator.contentTypes?.length;
  const languages = tagOverlap(brand.languages, creator.languages);
  const content = tagOverlap(brand.contentTypes, creator.contentTypes);
  if (hasLanguages && hasContent) return 0.6 * languages + 0.4 * content;
  return hasLanguages ? languages : content;
}

// Reads the creator's self-reported metrics: engagement rate in percent
// (Profile.metrics.averageEngagementRate) and Profile.followersCount.
function engagementScore(creator: MatchProfile): number {
  const rate = Number(creator.metrics?.averageEngagementRate) || 0;
  const followers = Number(creator.followersCount) || 0;
  return clamp01(
    0.7 * clamp01(rate / FULL_ENGAGEMENT_RATE) +
      0.3 * clamp01(followers / FULL_FOLLOWERS),
  );
}

/** How well a creator fits a brand, from their two profiles. Pure. */
export function matchScore(
  brand: MatchProfile,
  creator: MatchProfile,
): MatchScore {
  const parts = {
    categoryMatch: tagOverlap(brand.categories, creator.categories),
    audienceMatch: audienceMatch(brand, creator),
    engagementScore: engagementScore(creator),
  };
  const weighted =
    parts.categoryMatch * MATCH_WEIGHTS.categoryMatch +
    parts.audienceMatch * MATCH_WEIGHTS.audienceMatch +
    parts.engagementScore * MATCH_WEIGHTS.engagementScore;
  return { ...parts, total: Math.round(clamp01(weighted) * 100) };
}
