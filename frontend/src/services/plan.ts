import api from './api';

export type Plan = 'free' | 'pro';

export interface PlanInfo {
  /** What the brand gets now; use this for feature checks. */
  plan: Plan;
  /** What is stored; differs from `plan` after expiry. */
  storedPlan: Plan;
  proExpiresAt: string | null;
  freeTestPeriod: boolean;
  /** The regular Pro price per month. */
  priceKzt: number;
  /** What the checkout charges: 0 in the test period, null when there is none (Kaspi + admin). */
  checkoutPriceKzt: number | null;
  /** Kaspi transfer details (Plan page); phone null until configured. */
  kaspiPhone: string | null;
  kaspiRecipient: string;
}

export const planService = {
  mine: async () => (await api.get('/plan/me')).data as PlanInfo,
  /** Test period only: Pro for 30 days at 0 ₸. Answers like `mine`. */
  checkout: async () => (await api.post('/plan/checkout')).data as PlanInfo,
};
