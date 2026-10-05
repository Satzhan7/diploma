import api from './api';
import type { Page, PageParams } from './page';

// Closed vocabularies; the values match backend/src/orders/brief-options.ts
// and are translated in the `briefs` namespace.
export const GOALS = ['launch', 'traffic', 'followers', 'event'] as const;
export const PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const;
export const FORMATS = ['reel', 'stories', 'post', 'video', 'short'] as const;
export const CITIES = ['almaty', 'astana', 'shymkent', 'any'] as const;
export const LANGUAGES = ['kk', 'ru', 'en'] as const;
/** The platform category list (backend `CATEGORIES`). */
export const CATEGORIES = [
  'Fashion',
  'Beauty',
  'Lifestyle',
  'Technology',
  'Fitness',
  'Food',
  'Travel',
  'Gaming',
  'Education',
  'Music',
  'Business',
  'Health',
] as const;

export type BriefGoal = (typeof GOALS)[number];
export type BriefPlatform = (typeof PLATFORMS)[number];
export type BriefFormat = (typeof FORMATS)[number];
export type BriefCity = (typeof CITIES)[number];
export type BriefLanguage = (typeof LANGUAGES)[number];

/** Spelled as the backend sends it (`in-progress` with a hyphen). */
export type BriefStatus = 'draft' | 'open' | 'in-progress' | 'review' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

/** The brand as creators see it: public identity only (decision D5). */
export interface BriefParty {
  profileId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  location: string | null;
}

/** The editable part of a brief. Everything but the title may be empty in a draft. */
export interface BriefFields {
  title: string;
  description: string | null;
  goal: BriefGoal | null;
  platform: BriefPlatform | null;
  formats: BriefFormat[];
  city: BriefCity | null;
  languages: BriefLanguage[];
  category: string | null;
  /** Tenge per creator. */
  budgetMin: number | null;
  budgetMax: number | null;
  deliverables: string | null;
  requirements: string | null;
  /** yyyy-mm-dd. */
  postBy: string | null;
}

export interface Brief extends BriefFields {
  id: string;
  status: BriefStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  brand: BriefParty | null;
  applicationsCount?: number;
  pendingCount?: number;
  myApplication?: { id: string; status: ApplicationStatus; proposedPrice: number | null } | null;
}

export interface FeedParams extends PageParams {
  category?: string;
  platform?: BriefPlatform;
  city?: BriefCity;
}

export interface BrandBriefParams extends PageParams {
  status?: BriefStatus[];
}

const params = ({ status, ...rest }: BrandBriefParams) => ({
  ...rest,
  ...(status?.length ? { status: status.join(',') } : {}),
});

export const briefsService = {
  create: async (data: Partial<BriefFields>): Promise<Brief> => (await api.post('/orders', data)).data,
  update: async (id: string, data: Partial<BriefFields>): Promise<Brief> =>
    (await api.patch(`/orders/${id}`, data)).data,
  publish: async (id: string): Promise<Brief> => (await api.post(`/orders/${id}/publish`)).data,
  cancel: async (id: string): Promise<Brief> => (await api.post(`/orders/${id}/cancel`)).data,
  get: async (id: string): Promise<Brief> => (await api.get(`/orders/${id}`)).data,
  /** The brand's own briefs, with application counts. */
  listMine: async (query: BrandBriefParams = {}): Promise<Page<Brief>> =>
    (await api.get('/orders/brand', { params: params(query) })).data,
  /** Creator feed: open briefs, newest first. */
  feed: async (query: FeedParams = {}): Promise<Page<Brief>> =>
    (await api.get('/orders/available', { params: query })).data,
};

const HOUR = 3_600_000;

/**
 * Time left until the end of the post-by day in Kazakhstan (UTC+5).
 * `hot` under 48 hours, the feed's warning badge.
 */
export function timeLeft(postBy: string, now = Date.now()) {
  const end = Date.parse(`${postBy}T23:59:59+05:00`);
  const hours = Math.max(0, Math.floor((end - now) / HOUR));
  return { hours, days: Math.floor(hours / 24), hot: hours < 48 };
}

/** Budget range as one string: "₸60 000 – 120 000" or a single amount. */
export function budgetLabel(
  brief: Pick<BriefFields, 'budgetMin' | 'budgetMax'>,
  formatMoney: (n: number) => string,
): string | null {
  const { budgetMin: min, budgetMax: max } = brief;
  if (min == null && max == null) return null;
  if (min == null || max == null || min === max) return formatMoney((max ?? min)!);
  return `${formatMoney(min)} – ${formatMoney(max)}`;
}

/** Fields publishing requires (backend brief-completeness.ts). */
export const REQUIRED_FIELDS = [
  'title',
  'description',
  'goal',
  'platform',
  'formats',
  'city',
  'budgetMin',
  'budgetMax',
  'deliverables',
  'postBy',
] as const;

/** Today in Kazakhstan (UTC+5), yyyy-mm-dd. */
export const todayInKazakhstan = (now = Date.now()) => new Date(now + 5 * HOUR).toISOString().slice(0, 10);

/**
 * What keeps a brief from being published, as field → rule; the same rules
 * the server answers with (`isNotEmpty`, `budgetRange`, `futureDate`).
 */
export function briefProblems(brief: BriefFields, now = Date.now()): Record<string, string> {
  const problems: Record<string, string> = {};
  for (const field of REQUIRED_FIELDS) {
    const value = brief[field];
    if (value == null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length)) {
      problems[field] = 'isNotEmpty';
    }
  }
  const { budgetMin: min, budgetMax: max } = brief;
  if (min != null && max != null && (min < 1 || min > max) && !problems.budgetMax) problems.budgetMax = 'budgetRange';
  if (brief.postBy && brief.postBy <= todayInKazakhstan(now)) problems.postBy = 'futureDate';
  return problems;
}
