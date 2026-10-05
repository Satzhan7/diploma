import api from './api';

export type Plan = 'free' | 'pro';

export interface PlanInfo {
  /** What the brand gets now; use this for feature checks. */
  plan: Plan;
  /** What an admin set; in the test period everyone gets Pro anyway. */
  storedPlan: Plan;
  proExpiresAt: string | null;
  freeTestPeriod: boolean;
  priceKzt: number;
  /** Kaspi transfer details (Plan page); phone null until configured. */
  kaspiPhone: string | null;
  kaspiRecipient: string;
}

export const planService = {
  mine: async () => (await api.get('/plan/me')).data as PlanInfo,
};
