import { describe, expect, it } from 'vitest';
import { BriefFields, briefProblems, budgetLabel, timeLeft, todayInKazakhstan } from './briefs';

const complete: BriefFields = {
  title: 'Spring menu',
  description: 'Six new dishes',
  goal: 'launch',
  platform: 'instagram',
  formats: ['reel'],
  city: 'almaty',
  languages: [],
  category: null,
  budgetMin: 60000,
  budgetMax: 120000,
  deliverables: '1 Reel',
  requirements: null,
  postBy: '2026-10-20',
};
const now = Date.parse('2026-10-04T20:00:00Z'); // 01:00 on the 5th in Almaty

describe('briefProblems', () => {
  it('passes a complete brief', () => {
    expect(briefProblems(complete, now)).toEqual({});
  });

  it('uses the server rules', () => {
    expect(
      briefProblems({ ...complete, description: ' ', formats: [], budgetMin: 200000, postBy: '2026-10-05' }, now),
    ).toEqual({ description: 'isNotEmpty', formats: 'isNotEmpty', budgetMax: 'budgetRange', postBy: 'futureDate' });
  });

  it('counts the day in Kazakhstan time', () => {
    expect(todayInKazakhstan(now)).toBe('2026-10-05');
  });
});

describe('timeLeft', () => {
  it('runs to the end of the post-by day and is hot under 48 h', () => {
    expect(timeLeft('2026-10-05', now)).toEqual({ hours: 22, days: 0, hot: true });
    expect(timeLeft('2026-10-08', now)).toMatchObject({ days: 3, hot: false });
    expect(timeLeft('2026-10-01', now)).toMatchObject({ hours: 0, hot: true });
  });
});

describe('budgetLabel', () => {
  const money = (n: number) => `₸${n}`;
  it('shows a range, a single amount or nothing', () => {
    expect(budgetLabel({ budgetMin: 1, budgetMax: 2 }, money)).toBe('₸1 – ₸2');
    expect(budgetLabel({ budgetMin: 5, budgetMax: 5 }, money)).toBe('₸5');
    expect(budgetLabel({ budgetMin: null, budgetMax: 7 }, money)).toBe('₸7');
    expect(budgetLabel({ budgetMin: null, budgetMax: null }, money)).toBeNull();
  });
});
