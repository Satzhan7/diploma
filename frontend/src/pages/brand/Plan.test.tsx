import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '../../i18n';
import theme from '../../theme';
import { Plan } from './Plan';
import { planService, type PlanInfo } from '../../services/plan';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me', role: 'brand', email: 'owner@brand.test' } }),
}));
vi.mock('../../services/api', () => ({ __esModule: true, default: { get: vi.fn() } }));

const info = (overrides: Partial<PlanInfo>): PlanInfo => ({
  plan: 'free',
  storedPlan: 'free',
  proExpiresAt: null,
  freeTestPeriod: false,
  priceKzt: 19900,
  kaspiPhone: '+7 700 000 00 00',
  kaspiRecipient: 'AdPartners',
  ...overrides,
});

const renderPlan = (data: PlanInfo) => {
  vi.spyOn(planService, 'mine').mockResolvedValue(data);
  render(
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Plan />
      </QueryClientProvider>
    </ChakraProvider>,
  );
};

describe('Plan page', () => {
  beforeAll(() => i18n.changeLanguage('en'));

  it('shows the test period and no payment step while it is on', async () => {
    renderPlan(info({ plan: 'pro', freeTestPeriod: true }));
    expect(await screen.findByText(/Free during the test period/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'How to get Pro' })).not.toBeInTheDocument();
    expect(screen.getByText(/19[\s,.\u00a0\u202f]?900/)).toBeInTheDocument();
  });

  it('shows the Kaspi transfer steps to a Free brand after the test period', async () => {
    renderPlan(info({}));
    expect(await screen.findByRole('heading', { name: 'How to get Pro' })).toBeInTheDocument();
    expect(screen.getByText(/\+7 700 000 00 00 \(AdPartners\)/)).toBeInTheDocument();
    expect(screen.getByText(/owner@brand\.test/)).toBeInTheDocument();
    expect(screen.queryByText(/Free during the test period/)).not.toBeInTheDocument();
  });

  it('shows a paid Pro brand its end date and no payment step', async () => {
    renderPlan(info({ plan: 'pro', storedPlan: 'pro', proExpiresAt: '2099-11-05T18:59:59.000Z' }));
    expect(await screen.findByText(/Pro until/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'How to get Pro' })).not.toBeInTheDocument();
  });
});
