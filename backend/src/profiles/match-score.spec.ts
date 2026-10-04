import { matchScore, MatchProfile, tagOverlap } from './match-score';

const profile = (p: Partial<MatchProfile> = {}): MatchProfile => ({
  categories: [],
  languages: [],
  contentTypes: [],
  metrics: undefined as unknown as MatchProfile['metrics'],
  followersCount: undefined as unknown as number,
  ...p,
});

const metrics = (averageEngagementRate: number) => ({
  averageEngagementRate,
  averageViews: 0,
  averageLikes: 0,
  averageComments: 0,
});

describe('tagOverlap', () => {
  it('is Jaccard overlap, case-insensitive and symmetric', () => {
    expect(tagOverlap(['Food', 'beauty'], ['food', 'Sport'])).toBeCloseTo(
      1 / 3,
    );
    expect(tagOverlap(['food', 'Sport'], ['Food', 'beauty'])).toBeCloseTo(
      1 / 3,
    );
  });

  it('is 0 when either side is empty or missing', () => {
    expect(tagOverlap([], ['food'])).toBe(0);
    expect(tagOverlap(['food'], null)).toBe(0);
  });
});

describe('matchScore', () => {
  it('scores 0 for profiles with nothing in common and no metrics', () => {
    expect(matchScore(profile(), profile()).total).toBe(0);
  });

  it('scores 100 for a perfect fit', () => {
    const tags = {
      categories: ['food'],
      languages: ['ru', 'kk'],
      contentTypes: ['reels'],
    };
    const result = matchScore(
      profile(tags),
      profile({ ...tags, metrics: metrics(10), followersCount: 100_000 }),
    );
    expect(result).toEqual({
      categoryMatch: 1,
      audienceMatch: 1,
      engagementScore: 1,
      total: 100,
    });
  });

  it('weights categories 0.4, audience 0.3 and engagement 0.3', () => {
    expect(
      matchScore(
        profile({ categories: ['food'] }),
        profile({ categories: ['food'] }),
      ).total,
    ).toBe(40);
    expect(
      matchScore(profile({ languages: ['ru'] }), profile({ languages: ['ru'] }))
        .total,
    ).toBe(30);
    expect(
      matchScore(
        profile(),
        profile({ metrics: metrics(10), followersCount: 100_000 }),
      ).total,
    ).toBe(30);
  });

  it('mixes languages 0.6 and content types 0.4 when both sides have both', () => {
    const result = matchScore(
      profile({ languages: ['ru'], contentTypes: ['reels'] }),
      profile({ languages: ['ru'], contentTypes: ['stories'] }),
    );
    expect(result.audienceMatch).toBeCloseTo(0.6);
  });

  it('reads engagement from Profile.metrics (percent) and followersCount, capped at 1', () => {
    expect(
      matchScore(profile(), profile({ metrics: metrics(5) })).engagementScore,
    ).toBeCloseTo(0.35);
    expect(
      matchScore(profile(), profile({ followersCount: 50_000 }))
        .engagementScore,
    ).toBeCloseTo(0.15);
    expect(
      matchScore(
        profile(),
        profile({ metrics: metrics(80), followersCount: 5_000_000 }),
      ).engagementScore,
    ).toBe(1);
  });

  it('ignores the brand metrics and does not mutate its inputs', () => {
    const brand = profile({ categories: ['food'], metrics: metrics(99) });
    const creator = profile({ categories: ['Food'] });
    const before = JSON.stringify([brand, creator]);
    expect(matchScore(brand, creator).engagementScore).toBe(0);
    expect(JSON.stringify([brand, creator])).toBe(before);
  });
});
