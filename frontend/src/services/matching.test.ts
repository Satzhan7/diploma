import api from './api';
import { matchingService } from './matching';

jest.mock('./api', () => ({
  __esModule: true,
  default: { post: jest.fn(), patch: jest.fn() },
}));

describe('matchingService core mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('expresses interest through the server-derived identity endpoint', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 'match-1' } });

    await expect(matchingService.expressInterest('brand-1')).resolves.toEqual({
      id: 'match-1',
    });

    expect(api.post).toHaveBeenCalledWith('/matching/interests/brand-1');
  });

  it('uses the guarded completion endpoint', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: { id: 'match-1' } });

    await matchingService.completeMatch('match-1');

    expect(api.patch).toHaveBeenCalledWith('/matching/match-1/complete');
  });
});
