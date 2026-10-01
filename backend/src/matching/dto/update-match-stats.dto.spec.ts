import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateMatchStatsDto } from './update-match-stats.dto';

describe('UpdateMatchStatsDto', () => {
  it('accepts finite, non-negative analytics values', async () => {
    const errors = await validate(
      plainToInstance(UpdateMatchStatsDto, {
        clicks: 12,
        impressions: 100,
        engagementRate: 4.2,
        followerGrowth: 3,
      }),
    );

    expect(errors).toHaveLength(0);
  });

  it.each([
    { clicks: -1 },
    { clicks: '100' },
    { engagementRate: 101 },
    { impressions: Number.NaN },
  ])('rejects invalid analytics payload %o', async (payload) => {
    const errors = await validate(
      plainToInstance(UpdateMatchStatsDto, payload),
    );

    expect(errors.length).toBeGreaterThan(0);
  });
});
