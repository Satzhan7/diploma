// Closed vocabularies of a brief. The frontend translates each value
// (briefs namespace), so the values themselves never change.

export enum BriefGoal {
  LAUNCH = 'launch',
  TRAFFIC = 'traffic',
  FOLLOWERS = 'followers',
  EVENT = 'event',
}

export enum BriefPlatform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
}

export const BRIEF_FORMATS = [
  'reel',
  'stories',
  'post',
  'video',
  'short',
] as const;
export type BriefFormat = (typeof BRIEF_FORMATS)[number];

/** `any` means the creator may be in any city. */
export const BRIEF_CITIES = ['almaty', 'astana', 'shymkent', 'any'] as const;
export type BriefCity = (typeof BRIEF_CITIES)[number];

export const BRIEF_LANGUAGES = ['kk', 'ru', 'en'] as const;
export type BriefLanguage = (typeof BRIEF_LANGUAGES)[number];
