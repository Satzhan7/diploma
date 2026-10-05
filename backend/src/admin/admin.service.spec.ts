import { AdminService } from './admin.service';
import { VerificationStatus } from '../verification/entities/creator-verification.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Plan } from '../plan/plan';
import { ErrorCode } from '../common/errors/error-codes';

describe('AdminService', () => {
  const claim = {
    id: 'v1',
    profileId: 'p1',
    followers: 48000,
    engagementRate: 6.8,
    status: VerificationStatus.PENDING,
    submittedAt: new Date('2026-10-05T10:00:00.000Z'),
    profile: { id: 'p1', user: { id: 'u1', name: 'C', email: 'c@x.test' } },
  };
  const updateBuilder = (affected: number) => {
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      execute: jest.fn(async () => ({ affected })),
    };
    return qb;
  };
  const setup = (affected: number, row: object | null = claim) => {
    const reviewQb = updateBuilder(affected);
    const profileQb = updateBuilder(1);
    const manager = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(reviewQb)
        .mockReturnValueOnce(profileQb),
      findOne: jest.fn(async () => row),
      findOneOrFail: jest.fn(async () => row),
      update: jest.fn(),
      insert: jest.fn(),
    };
    const service = new AdminService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { transaction: jest.fn((work) => work(manager)) } as any,
    );
    return { service, manager, reviewQb, profileQb };
  };

  it('approves the claim the admin saw, locks the stats and logs it', async () => {
    const { service, manager, reviewQb, profileQb } = setup(1);
    await service.approveVerification(
      'admin',
      'v1',
      '2026-10-05T10:00:00.000Z',
    );
    expect(reviewQb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: VerificationStatus.APPROVED,
        reviewedById: 'admin',
      }),
    );
    expect(reviewQb.andWhere).toHaveBeenCalledWith(
      '"submittedAt" = :submittedAt',
      {
        submittedAt: new Date('2026-10-05T10:00:00.000Z'),
      },
    );
    expect(profileQb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        verifiedAt: expect.any(Date),
        followersCount: 48000,
      }),
    );
    expect(manager.insert).toHaveBeenCalledWith(
      AuditLog,
      expect.objectContaining({
        actorId: 'admin',
        action: 'verification.approve',
        targetType: 'verification',
        targetId: 'v1',
      }),
    );
  });

  it('refuses a claim that was resubmitted or reviewed meanwhile', async () => {
    const { service, manager } = setup(0);
    await expect(
      service.approveVerification('admin', 'v1', '2026-10-05T09:00:00.000Z'),
    ).rejects.toMatchObject({
      status: 409,
      response: expect.objectContaining({
        code: ErrorCode.VERIFICATION_STALE,
      }),
    });
    expect(manager.insert).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown claim', async () => {
    const { service } = setup(0, null);
    await expect(
      service.rejectVerification(
        'admin',
        'v9',
        claim.submittedAt.toISOString(),
        'Blurry',
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('rejects with the reason and clears the badge', async () => {
    const { service, manager, reviewQb } = setup(1);
    await service.rejectVerification(
      'admin',
      'v1',
      claim.submittedAt.toISOString(),
      'Blurry screenshot',
    );
    expect(reviewQb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: VerificationStatus.REJECTED,
        rejectReason: 'Blurry screenshot',
      }),
    );
    expect(manager.update).toHaveBeenCalledWith(expect.anything(), 'p1', {
      verifiedAt: null,
    });
    expect(manager.insert).toHaveBeenCalledWith(
      AuditLog,
      expect.objectContaining({
        action: 'verification.reject',
        details: { profileId: 'p1', reason: 'Blurry screenshot' },
      }),
    );
  });

  it('refuses a Pro expiry in the past', async () => {
    const { service } = setup(1);
    await expect(
      service.setPlan('admin', 'p1', {
        plan: Plan.PRO,
        proExpiresAt: '2020-01-01T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({
        code: ErrorCode.VALIDATION_FAILED,
      }),
    });
  });
});
