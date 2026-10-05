import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '../../i18n';
import theme from '../../theme';
import { Plan } from './Plan';
import { planService, type PlanInfo } from '../../services/plan';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me', role: 'brand', email: 'owner@brand.test' } }),
}));
vi.mock('../../services/api', () => ({ __esModule: true, default: { get: vi.fn(), post: vi.fn() } }));

const info = (overrides: Partial<PlanInfo>): PlanInfo => ({
  plan: 'free',
  storedPlan: 'free',
  proExpiresAt: null,
  freeTestPeriod: false,
  priceKzt: 19900,
  checkoutPriceKzt: null,
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

  const testFree = () => info({ freeTestPeriod: true, checkoutPriceKzt: 0 });
  const card = (name: string) => screen.getByRole('region', { name });

  it('offers a 0 ₸ checkout in the test period, with the regular price as a note and no payment step', async () => {
    renderPlan(testFree());
    expect(await screen.findByText(/Pro costs ₸0 for 30 days, and nobody is charged/)).toBeInTheDocument();
    expect(within(card('Free')).getByText('₸0')).toBeInTheDocument();
    expect(within(card('Pro')).getByText('₸0')).toBeInTheDocument();
    expect(within(card('Pro')).getByText(/19[\s,.\u00a0\u202f]?900 per month after the test/)).toBeInTheDocument();
    expect(within(card('Pro')).getByRole('button', { name: 'Get Pro for ₸0' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'How to get Pro' })).not.toBeInTheDocument();
  });

  it('turns Pro on through the checkout and shows the end date', async () => {
    renderPlan(testFree());
    const checkout = vi
      .spyOn(planService, 'checkout')
      .mockResolvedValue({ ...testFree(), plan: 'pro', storedPlan: 'pro', proExpiresAt: '2099-11-04T12:00:00.000Z' });
    vi.spyOn(planService, 'mine').mockResolvedValue({
      ...testFree(),
      plan: 'pro',
      storedPlan: 'pro',
      proExpiresAt: '2099-11-04T12:00:00.000Z',
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Get Pro for ₸0' }));
    expect(await within(card('Pro')).findByText(/Pro until/)).toBeInTheDocument();
    expect(checkout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Get Pro for ₸0' })).not.toBeInTheDocument();
  });

  it('shows the Free price in the money format', async () => {
    renderPlan(info({}));
    expect(await within(await screen.findByRole('region', { name: 'Free' })).findByText('₸0')).toBeInTheDocument();
  });

  it('shows the Kaspi transfer steps to a Free brand after the test period', async () => {
    renderPlan(info({}));
    expect(await screen.findByRole('heading', { name: 'How to get Pro' })).toBeInTheDocument();
    expect(screen.getByText(/\+7 700 000 00 00 \(AdPartners\)/)).toBeInTheDocument();
    expect(screen.getByText(/owner@brand\.test/)).toBeInTheDocument();
    expect(screen.queryByText(/Test period/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Get Pro/ })).not.toBeInTheDocument();
  });

  it('shows a paid Pro brand its end date and no payment step', async () => {
    renderPlan(info({ plan: 'pro', storedPlan: 'pro', proExpiresAt: '2099-11-05T18:59:59.000Z' }));
    expect(await screen.findByText(/Pro until/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'How to get Pro' })).not.toBeInTheDocument();
  });
});
