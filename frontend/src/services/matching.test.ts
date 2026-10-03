import type { Mock } from 'vitest';
import api from './api';
import { matchingService } from './matching';

vi.mock('./api', () => ({
  __esModule: true,
  default: { post: vi.fn(), patch: vi.fn() },
}));

describe('matchingService core mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('expresses interest through the server-derived identity endpoint', async () => {
    (api.post as Mock).mockResolvedValue({ data: { id: 'match-1' } });

    await expect(matchingService.expressInterest('brand-1')).resolves.toEqual({
      id: 'match-1',
    });

    expect(api.post).toHaveBeenCalledWith('/matching/interests/brand-1');
  });

  it('uses the guarded completion endpoint', async () => {
    (api.patch as Mock).mockResolvedValue({ data: { id: 'match-1' } });

    await matchingService.completeMatch('match-1');

    expect(api.patch).toHaveBeenCalledWith('/matching/match-1/complete');
  });
});
