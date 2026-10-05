import { DealParty, toParty } from '../deals/deal-view';
import { Order, OrderStatus } from './entities/order.entity';
import { ApplicationStatus } from './entities/order-application.entity';
import {
  BriefCity,
  BriefFormat,
  BriefGoal,
  BriefLanguage,
  BriefPlatform,
} from './brief-options';

// The viewer's own application on a brief (creator side only).
export interface MyApplicationRef {
  id: string;
  status: ApplicationStatus;
  proposedPrice: number | null;
}

// A brief as every side sees it. The brand is a public party: no email
// (decision D5), no assigned creator, no applicant list.
export interface BriefView {
  id: string;
  title: string;
  description: string | null;
  goal: BriefGoal | null;
  platform: BriefPlatform | null;
  formats: BriefFormat[];
  city: BriefCity | null;
  languages: BriefLanguage[];
  category: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  deliverables: string | null;
  requirements: string | null;
  postBy: string | null;
  publishedAt: Date | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  brand: DealParty | null;
  /** Applications that are not withdrawn. */
  applicationsCount?: number;
  /** Brand lists only: applications waiting for a decision. */
  pendingCount?: number;
  /** Creator views only. */
  myApplication?: MyApplicationRef | null;
}

export type BriefCounts = Pick<
  BriefView,
  'applicationsCount' | 'pendingCount' | 'myApplication'
>;

export function toBriefView(order: Order, extra: BriefCounts = {}): BriefView {
  return {
    id: order.id,
    title: order.title,
    description: order.description ?? null,
    goal: order.goal ?? null,
    platform: order.platform ?? null,
    formats: order.formats ?? [],
    city: order.city ?? null,
    languages: order.languages ?? [],
    category: order.category ?? null,
    budgetMin: order.budgetMin ?? null,
    budgetMax: order.budgetMax ?? null,
    deliverables: order.deliverables ?? null,
    requirements: order.requirements ?? null,
    postBy: order.postBy ?? null,
    publishedAt: order.publishedAt ?? null,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    brand: order.brand ? toParty(order.brand, order.brand.companyName) : null,
    ...extra,
  };
}
