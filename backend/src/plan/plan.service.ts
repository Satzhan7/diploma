import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { PRO_PRICE_KZT } from '../config/configuration';
import { apiError, ErrorCode } from '../common/errors/error-codes';
import { effectivePlan, Plan } from './plan';

export interface PlanView {
  /** What the brand gets now: use this for every feature check. */
  plan: Plan;
  /** What an admin set; differs from `plan` in the test period or after expiry. */
  storedPlan: Plan;
  proExpiresAt: Date | null;
  freeTestPeriod: boolean;
  priceKzt: number;
}

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    private readonly config: ConfigService,
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

  view(profile: Pick<Profile, 'plan' | 'proExpiresAt'>): PlanView {
    return {
      plan: effectivePlan(profile, new Date(), this.freeTestPeriod),
      storedPlan: profile.plan,
      proExpiresAt: profile.proExpiresAt,
      freeTestPeriod: this.freeTestPeriod,
      priceKzt: PRO_PRICE_KZT,
    };
  }
}
