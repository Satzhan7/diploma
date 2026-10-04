import { Profile } from '../profiles/entities/profile.entity';
import { Deal, DealStatus } from './entities/deal.entity';

// A side of a deal as the other side sees it: public identity only. Emails
// are never part of a deal response (decision D5); the two sides use chat.
export interface DealParty {
  profileId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  location: string | null;
}

export interface DealView {
  id: string;
  status: DealStatus;
  agreedPrice: number;
  deliverables: string | null;
  postBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  order: { id: string; title: string; category: string | null };
  brand: DealParty;
  creator: DealParty;
}

function toParty(
  profile: Profile,
  preferredName: string | undefined,
): DealParty {
  return {
    profileId: profile.id,
    userId: profile.user?.id ?? null,
    name: preferredName || profile.displayName || profile.user?.name || '',
    avatarUrl: profile.avatarUrl ?? null,
    location: profile.location ?? null,
  };
}

export function toDealView(deal: Deal): DealView {
  return {
    id: deal.id,
    status: deal.status,
    agreedPrice: deal.agreedPrice,
    deliverables: deal.deliverables,
    postBy: deal.postBy,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    order: {
      id: deal.order.id,
      title: deal.order.title,
      category: deal.order.category ?? null,
    },
    brand: toParty(deal.brandProfile, deal.brandProfile.companyName),
    creator: toParty(deal.creatorProfile, deal.creatorProfile.displayName),
  };
}
