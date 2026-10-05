import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { AuditLog } from '../admin/entities/audit-log.entity';
import { PRO_PRICE_KZT } from '../config/configuration';
import { apiError, ErrorCode } from '../common/errors/error-codes';
import { effectivePlan, Plan } from './plan';

/** How long the test-period checkout gives Pro for. */
export const CHECKOUT_PRO_DAYS = 30;

export interface PlanView {
  /** What the brand gets now: use this for every feature check. */
  plan: Plan;
  /** What is stored; differs from `plan` after expiry. */
  storedPlan: Plan;
  proExpiresAt: Date | null;
  freeTestPeriod: boolean;
  /** The regular Pro price per month. */
  priceKzt: number;
  /** What the checkout charges: 0 in the test period, null when there is none. */
  checkoutPriceKzt: number | null;
  /** Kaspi transfer details for the Plan page; phone null until configured. */
  kaspiPhone: string | null;
  kaspiRecipient: string;
}

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  get freeTestPeriod(): boolean {
    return this.config.get<boolean>('freeTestPeriod') ?? true;
  }

  /** Read on every call, never cached: an admin change applies at once. */
  async forUser(userId: string): Promise<PlanView> {
    const profile = await this.profiles.findOne({
      where: { user: { id: userId } },
      select: { id: true, plan: true, proExpiresAt: true },
    });
    if (!profile) {
      throw new NotFoundException(
        apiError(ErrorCode.PROFILE_NOT_FOUND, 'Profile not found'),
      );
    }
    return this.view(profile);
  }

  /**
   * The test-period checkout: Pro for CHECKOUT_PRO_DAYS at 0 ₸. Outside the
   * test period there is no checkout (a brand pays by Kaspi transfer and an
   * admin sets the plan). The row lock serialises double clicks.
   */
  async checkout(userId: string): Promise<PlanView> {
    if (!this.freeTestPeriod) {
      throw new ConflictException(
        apiError(
          ErrorCode.PLAN_CHECKOUT_UNAVAILABLE,
          'Checkout is only available during the test period',
        ),
      );
    }
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager
        .createQueryBuilder(Profile, 'profile')
        .setLock('pessimistic_write')
        .where('profile.user_id = :userId', { userId })
        .getOne();
      if (!profile) {
        throw new NotFoundException(
          apiError(ErrorCode.PROFILE_NOT_FOUND, 'Profile not found'),
        );
      }
      const now = new Date();
      if (effectivePlan(profile, now) === Plan.PRO) {
        throw new ConflictException(
          apiError(ErrorCode.PLAN_ALREADY_PRO, 'The Pro plan is already on'),
        );
      }
      const proExpiresAt = new Date(
        now.getTime() + CHECKOUT_PRO_DAYS * 24 * 60 * 60 * 1000,
      );
      await manager.update(Profile, profile.id, {
        plan: Plan.PRO,
        proExpiresAt,
      });
      await manager.insert(AuditLog, {
        actorId: userId,
        action: 'plan.checkout',
        targetType: 'profile',
        targetId: profile.id,
        details: { priceKzt: 0, proExpiresAt },
      });
      return this.view({ plan: Plan.PRO, proExpiresAt });
    });
  }

  view(profile: Pick<Profile, 'plan' | 'proExpiresAt'>): PlanView {
    return {
      plan: effectivePlan(profile, new Date()),
      storedPlan: profile.plan,
      proExpiresAt: profile.proExpiresAt,
      freeTestPeriod: this.freeTestPeriod,
      priceKzt: PRO_PRICE_KZT,
      checkoutPriceKzt: this.freeTestPeriod ? 0 : null,
      kaspiPhone: this.config.get<string | null>('kaspi.phone') ?? null,
      kaspiRecipient:
        this.config.get<string>('kaspi.recipient') ?? 'AdPartners',
    };
  }
}
