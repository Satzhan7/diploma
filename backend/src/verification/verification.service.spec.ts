import { VerificationService } from './verification.service';
import { VerificationStatus } from './entities/creator-verification.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { StoredFile } from '../files/entities/stored-file.entity';

describe('VerificationService.submit', () => {
  const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const setup = (existing: object | null) => {
    const manager = {
      createQueryBuilder: jest.fn(() => ({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn(async () => ({ id: 'p1' })),
      })),
      findOne: jest
        .fn()
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 'old-shot', storageKey: 'old.png' }),
      create: jest.fn((_entity, data) => data),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const filesService = {
      checkImage: jest.fn(),
      saveImage: jest.fn(async () => ({
        id: 'new-shot',
        storageKey: 'new.png',
      })),
      discard: jest.fn(),
    };
    const service = new VerificationService(
      {} as any,
      {} as any,
      filesService as any,
      { transaction: jest.fn((work) => work(manager)) } as any,
    );
    return { service, manager, filesService };
  };

  it('replaces a reviewed claim, clears the badge and drops the old screenshot', async () => {
    const { service, manager, filesService } = setup({
      id: 'v1',
      profileId: 'p1',
      status: VerificationStatus.REJECTED,
      rejectReason: 'Blurry',
      screenshotId: 'old-shot',
    });
    const view = await service.submit(
      'u1',
      { followers: 50000, engagementRate: 7.1 },
      { buffer: PNG, size: PNG.length },
    );
    expect(view).toMatchObject({
      status: VerificationStatus.PENDING,
      followers: 50000,
      engagementRate: 7.1,
      rejectReason: null,
      screenshotId: 'new-shot',
      verifiedAt: null,
    });
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'v1', status: VerificationStatus.PENDING }),
    );
    expect(manager.update).toHaveBeenCalledWith(Profile, 'p1', {
      verifiedAt: null,
    });
    expect(manager.delete).toHaveBeenCalledWith(StoredFile, { id: 'old-shot' });
    expect(filesService.discard).toHaveBeenCalledWith('old.png');
    expect(filesService.discard).not.toHaveBeenCalledWith('new.png');
  });

  it('removes the new screenshot when the transaction fails', async () => {
    const { service, manager, filesService } = setup(null);
    manager.save.mockRejectedValueOnce(new Error('db down'));
    await expect(
      service.submit(
        'u1',
        { followers: 1, engagementRate: 0 },
        { buffer: PNG, size: PNG.length },
      ),
    ).rejects.toThrow('db down');
    expect(filesService.discard).toHaveBeenCalledWith('new.png');
  });
});
