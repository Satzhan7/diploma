import api from './api';
import type { PillTone } from '../components/ui/StatusPill';
import type { Page } from './page';

export type DealStatus = 'active' | 'proof_submitted' | 'completed' | 'disputed' | 'cancelled';

/** One side of a deal: public identity only, never an email (decision D5). */
export interface DealParty {
  profileId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  location: string | null;
}

export interface Deal {
  id: string;
  status: DealStatus;
  /** Tenge. */
  agreedPrice: number;
  deliverables: string | null;
  /** ISO date (yyyy-mm-dd). */
  postBy: string | null;
  createdAt: string;
  updatedAt: string;
  order: { id: string; title: string; category: string | null };
  brand: DealParty;
  creator: DealParty;
}

export interface DealListParams {
  take?: number;
  skip?: number;
  status?: DealStatus;
}

/** Status pill colour per deal status. */
export const DEAL_TONE: Record<DealStatus, PillTone> = {
  active: 'primary',
  proof_submitted: 'warn',
  completed: 'success',
  disputed: 'danger',
  cancelled: 'neutral',
};

export const DEAL_STEPS = ['accepted', 'creating', 'proofSent', 'completed'] as const;
export type DealStep = (typeof DEAL_STEPS)[number];

/**
 * Index of the current stepper step (docs/adr/0001-deal-pipeline.md):
 * active → Creating, proof sent or disputed → Proof sent, completed → Completed.
 * A cancelled deal stays where it stopped; its status pill says why.
 */
export const dealStepIndex = (status: DealStatus): number => {
  switch (status) {
    case 'completed':
      return 3;
    case 'proof_submitted':
    case 'disputed':
      return 2;
    default:
      return 1;
  }
};

export const dealsService = {
  list: async (params: DealListParams = {}): Promise<Page<Deal>> => {
    const response = await api.get('/deals', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Deal> => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },
};
