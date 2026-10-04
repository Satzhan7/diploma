import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../i18n';
import theme from '../theme';
import { Deal } from './Deal';
import { dealStepIndex, dealsService, type Deal as DealModel } from '../services/deals';
import { UserRole } from '../types/user';

const auth = vi.hoisted(() => ({ role: 'brand' }));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me', role: auth.role } }),
}));
vi.mock('../services/api', () => ({ __esModule: true, default: { get: vi.fn(), post: vi.fn() } }));

const deal: DealModel = {
  id: 'deal-1',
  status: 'active',
  agreedPrice: 90000,
  deliverables: '1 Reel + 3 Stories',
  postBy: '2026-10-15',
  createdAt: '2026-09-27T10:00:00.000Z',
  updatedAt: '2026-09-27T10:00:00.000Z',
  order: { id: 'order-1', title: 'Spring menu launch', category: 'Food' },
  brand: { profileId: 'bp', userId: 'brand-user', name: 'Café Daryn', avatarUrl: null, location: 'Almaty' },
  creator: { profileId: 'cp', userId: 'creator-user', name: 'Arman Tolegen', avatarUrl: null, location: null },
};

const renderDeal = (role: UserRole) => {
  auth.role = role;
  return render(
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[`/${role}/deals/deal-1`]}>
          <Routes>
            <Route path="/:role/deals/:dealId" element={<Deal />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>,
  );
};

describe('Deal page', () => {
  beforeAll(() => i18n.changeLanguage('en'));
  afterAll(() => i18n.changeLanguage('ru'));

  it('maps every status onto the four stepper steps', () => {
    expect(dealStepIndex('active')).toBe(1);
    expect(dealStepIndex('proof_submitted')).toBe(2);
    expect(dealStepIndex('disputed')).toBe(2);
    expect(dealStepIndex('completed')).toBe(3);
    expect(dealStepIndex('cancelled')).toBe(1);
  });

  it('shows the creator, the stepper and the terms to the brand', async () => {
    vi.spyOn(dealsService, 'getById').mockResolvedValue(deal);
    renderDeal(UserRole.BRAND);

    expect(await screen.findByRole('heading', { level: 1, name: 'Deal with Arman Tolegen' })).toBeInTheDocument();
    const steps = screen.getByRole('list', { name: 'Deal progress' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(4);
    expect(within(steps).getByText('Creating').closest('li')).toHaveAttribute('aria-current', 'step');

    const terms = screen.getByRole('region', { name: 'Deal terms' });
    expect(within(terms).getByText('Direct, off-platform')).toBeInTheDocument();
    expect(within(terms).getByText('1 Reel + 3 Stories')).toBeInTheDocument();
    expect(within(terms).getByText(/90/)).toBeInTheDocument();
    expect(screen.getByText('Waiting for Arman to post')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Message Arman/ })).toBeInTheDocument();
  });

  it('shows the brand to the creator', async () => {
    vi.spyOn(dealsService, 'getById').mockResolvedValue(deal);
    renderDeal(UserRole.INFLUENCER);
    expect(await screen.findByRole('heading', { level: 1, name: 'Deal with Café Daryn' })).toBeInTheDocument();
    expect(screen.getByText('Create and post the content')).toBeInTheDocument();
  });

  it('shows "not found" for a deal the user is not part of', async () => {
    vi.spyOn(dealsService, 'getById').mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { code: 'DEAL_NOT_FOUND', message: 'Deal not found' } },
    });
    renderDeal(UserRole.BRAND);
    expect(await screen.findByText('Deal not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All deals' })).toHaveAttribute('href', '/brand/deals');
  });
});
