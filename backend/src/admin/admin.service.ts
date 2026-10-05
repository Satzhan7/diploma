import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import { Profile, ProfileType } from '../profiles/entities/profile.entity';
import {
  CreatorVerification,
  VerificationStatus,
} from '../verification/entities/creator-verification.entity';
import { Page } from '../common/dto/pagination-query.dto';
import { apiError, ErrorCode } from '../common/errors/error-codes';
import { PlanService, PlanView } from '../plan/plan.service';
import { Plan } from '../plan/plan';
import { AuditLog } from './entities/audit-log.entity';
import {
  ListBrandsQueryDto,
  ListVerificationsQueryDto,
  SetPlanDto,
} from './dto/admin.dto';

export interface AdminVerificationView {
  id: string;
  status: VerificationStatus;
  followers: number;
  engagementRate: number;
  screenshotId: string | null;
  rejectReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  creator: {
    userId: string;
    profileId: string;
    name: string;
    email: string;
    /** Stats on the profile now, to compare with the claim. */
    followersCount: number | null;
    engagementRate: number | null;
    verifiedAt: Date | null;
  };
}

export interface AdminBrandView extends PlanView {
  profileId: string;
  userId: string;
  name: string;
  email: string;
  companyName: string | null;
}

export interface AuditLogView {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: Date;
  actor: { id: string; name: string } | null;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(CreatorVerification)
    private readonly verifications: Repository<CreatorVerification>,
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    @InjectRepository(AuditLog)
    private readonly auditLog: Repository<AuditLog>,
    private readonly planService: PlanService,
    private readonly dataSource: DataSource,
  ) {}

  // --- Verification queue ----------------------------------------------------

  /** Oldest claim first, so the queue is worked in order. */
  async listVerifications(
    query: ListVerificationsQueryDto,
  ): Promise<Page<AdminVerificationView>> {
    const { take, skip, status } = query;
    const [rows, total] = await this.verifications.findAndCount({
      where: status ? { status } : {},
      relations: { profile: { user: true } },
      order: { submittedAt: 'ASC', id: 'ASC' },
      take,
      skip,
    });
    return { items: rows.map(toAdminVerificationView), total, take, skip };
  }

  /** "Approve and lock stats": the claim becomes the profile's stats. */
  async approveVerification(
    adminId: string,
    id: string,
    submittedAt: string,
  ): Promise<AdminVerificationView> {
    return this.dataSource.transaction(async (manager) => {
      const row = await this.reviewClaim(manager, id, submittedAt, {
        status: VerificationStatus.APPROVED,
        rejectReason: null,
        reviewedById: adminId,
      });
      const now = new Date();
      await manager
        .createQueryBuilder()
        .update(Profile)
        .set({
          verifiedAt: now,
          followersCount: row.followers,
          metrics: () =>
            `jsonb_set(COALESCE("metrics", '{}'::jsonb), '{averageEngagementRate}', to_jsonb(:rate::numeric))`,
        })
        .where('id = :profileId', { profileId: row.profileId })
        .setParameter('rate', row.engagementRate)
        .execute();
      await this.record(
        manager,
        adminId,
        'verification.approve',
        { type: 'verification', id: row.id },
        {
          profileId: row.profileId,
          followers: row.followers,
          engagementRate: row.engagementRate,
        },
      );
      return this.verificationView(manager, row.id);
    });
  }

  async rejectVerification(
    adminId: string,
    id: string,
    submittedAt: string,
    reason: string,
  ): Promise<AdminVerificationView> {
    return this.dataSource.transaction(async (manager) => {
      const row = await this.reviewClaim(manager, id, submittedAt, {
        status: VerificationStatus.REJECTED,
        rejectReason: reason,
        reviewedById: adminId,
      });
      await manager.update(Profile, row.profileId, { verifiedAt: null });
      await this.record(
        manager,
        adminId,
        'verification.reject',
        { type: 'verification', id: row.id },
        {
          profileId: row.profileId,
          reason,
        },
      );
      return this.verificationView(manager, row.id);
    });
  }

  /**
   * Compare-and-set on a pending claim with the `submittedAt` the admin saw:
   * a resubmission in between (or a second admin) makes it 409, never a
   * review of numbers nobody looked at.
   */
  private async reviewClaim(
    manager: EntityManager,
    id: string,
    submittedAt: string,
    changes: Pick<
      CreatorVerification,
      'status' | 'rejectReason' | 'reviewedById'
    >,
  ): Promise<CreatorVerification> {
    const result = await manager
      .createQueryBuilder()
      .update(CreatorVerification)
      .set({ ...changes, reviewedAt: new Date() })
      .where('id = :id', { id })
      .andWhere('status = :pending', { pending: VerificationStatus.PENDING })
      .andWhere('"submittedAt" = :submittedAt', {
        submittedAt: new Date(submittedAt),
      })
      .execute();
    const row = await manager.findOne(CreatorVerification, { where: { id } });
    if (!row) {
      throw new NotFoundException(
        apiError(ErrorCode.VERIFICATION_NOT_FOUND, 'Verification not found'),
      );
    }
    if (!result.affected) {
      throw new ConflictException(
        apiError(
          ErrorCode.VERIFICATION_STALE,
          'The claim was resubmitted or already reviewed; reload the queue',
        ),
      );
    }
    return row;
  }

  private async verificationView(
    manager: EntityManager,
    id: string,
  ): Promise<AdminVerificationView> {
    const row = await manager.findOneOrFail(CreatorVerification, {
      where: { id },
      relations: { profile: { user: true } },
    });
    return toAdminVerificationView(row);
  }

  // --- Brand plans -----------------------------------------------------------

  async listBrands(query: ListBrandsQueryDto): Promise<Page<AdminBrandView>> {
    const { take, skip, search } = query;
    const qb = this.profiles
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('profile.type = :type', { type: ProfileType.BRAND })
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('profile.id', 'ASC')
      .take(take)
      .skip(skip);
    if (search?.trim()) {
      const like = `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`;
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('user.name ILIKE :like', { like })
            .orWhere('user.email ILIKE :like', { like })
            .orWhere('profile.companyName ILIKE :like', { like }),
        ),
      );
    }
    const [profiles, total] = await qb.getManyAndCount();
    return {
      items: profiles.map((profile) => this.toBrandView(profile)),
      total,
      take,
      skip,
    };
  }

  /** Takes effect on the brand's next request: plans are never cached. */
  async setPlan(
    adminId: string,
    profileId: string,
    dto: SetPlanDto,
  ): Promise<AdminBrandView> {
    const proExpiresAt =
      dto.plan === Plan.PRO && dto.proExpiresAt
        ? new Date(dto.proExpiresAt)
        : null;
    if (proExpiresAt && proExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Validation failed',
        details: [
          {
            field: 'proExpiresAt',
            rule: 'futureDate',
            message: 'proExpiresAt must be in the future',
          },
        ],
      });
    }
    return this.dataSource.transaction(async (manager) => {
      const profile = await manager
        .createQueryBuilder(Profile, 'profile')
        .setLock('pessimistic_write')
        .where('profile.id = :profileId', { profileId })
        .andWhere('profile.type = :type', { type: ProfileType.BRAND })
        .getOne();
      if (!profile) {
        throw new NotFoundException(
          apiError(ErrorCode.PROFILE_NOT_FOUND, 'Brand not found'),
        );
      }
      const before = { plan: profile.plan, proExpiresAt: profile.proExpiresAt };
      await manager.update(Profile, profile.id, {
        plan: dto.plan,
        proExpiresAt,
      });
      await this.record(
        manager,
        adminId,
        'plan.set',
        { type: 'profile', id: profile.id },
        {
          from: before,
          to: { plan: dto.plan, proExpiresAt },
        },
      );
      const updated = await manager.findOneOrFail(Profile, {
        where: { id: profile.id },
        relations: { user: true },
      });
      return this.toBrandView(updated);
    });
  }

  private toBrandView(profile: Profile): AdminBrandView {
    return {
      ...this.planService.view(profile),
      profileId: profile.id,
      userId: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      companyName: profile.companyName ?? null,
    };
  }

  // --- Audit log -------------------------------------------------------------

  async listAudit(query: {
    take: number;
    skip: number;
  }): Promise<Page<AuditLogView>> {
    const { take, skip } = query;
    const [rows, total] = await this.auditLog.findAndCount({
      relations: { actor: true },
      order: { createdAt: 'DESC', id: 'ASC' },
      take,
      skip,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        details: row.details,
        createdAt: row.createdAt,
        actor: row.actor ? { id: row.actor.id, name: row.actor.name } : null,
      })),
      total,
      take,
      skip,
    };
  }

  /** Same transaction as the action: no change without its log row. */
  private async record(
    manager: EntityManager,
    actorId: string,
    action: string,
    target: { type: 'profile' | 'verification'; id: string },
    details: Record<string, unknown>,
  ): Promise<void> {
    await manager.insert(AuditLog, {
      actorId,
      action,
      targetType: target.type,
      targetId: target.id,
      details,
    });
  }
}

function toAdminVerificationView(
  row: CreatorVerification,
): AdminVerificationView {
  const profile = row.profile;
  const rate = Number(profile.metrics?.averageEngagementRate);
  return {
    id: row.id,
    status: row.status,
    followers: row.followers,
    engagementRate: row.engagementRate,
    screenshotId: row.screenshotId,
    rejectReason: row.rejectReason,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    creator: {
      userId: profile.user.id,
      profileId: profile.id,
      name: profile.displayName || profile.user.name,
      email: profile.user.email,
      followersCount: profile.followersCount ?? null,
      engagementRate: Number.isFinite(rate) ? rate : null,
      verifiedAt: profile.verifiedAt,
    },
  };
}
