import { Readable } from 'stream';
import { FilesService, MAX_PORTFOLIO_IMAGES } from './files.service';
import { FileKind } from './entities/stored-file.entity';
import { UserRole } from '../users/entities/user.entity';
import { ErrorCode } from '../common/errors/error-codes';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);

describe('FilesService', () => {
  const storage = {
    put: jest.fn(async () => undefined),
    read: jest.fn(async () => Readable.from(['bytes'])),
    remove: jest.fn(async () => undefined),
  };
  const files = { findOne: jest.fn(), find: jest.fn(), delete: jest.fn() };
  const manager = {
    createQueryBuilder: jest.fn(() => ({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOneOrFail: jest.fn(async () => ({ id: 'profile-1' })),
    })),
    find: jest.fn(),
    create: jest.fn((_entity, data) => data),
    save: jest.fn(async (data) => ({ id: 'file-new', ...data })),
  };
  const dataSource = { transaction: jest.fn((work) => work(manager)) };
  let service: FilesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FilesService(files as any, storage as any, dataSource as any);
  });

  describe('open', () => {
    const stored = (kind: FileKind) => ({
      id: 'file-1',
      ownerId: 'owner',
      kind,
      storageKey: 'k.png',
      mimeType: 'image/png',
      size: 5,
    });
    const code = (promise: Promise<unknown>) =>
      promise.then(
        () => 'ok',
        (error) => `${error.status} ${error.response?.code}`,
      );

    it('serves portfolio images to anyone', async () => {
      files.findOne.mockResolvedValue(stored(FileKind.PORTFOLIO));
      await expect(code(service.open('file-1', null))).resolves.toBe('ok');
    });

    it('serves a screenshot to its owner and to admins only', async () => {
      files.findOne.mockResolvedValue(stored(FileKind.VERIFICATION));
      const owner = { id: 'owner', role: UserRole.INFLUENCER };
      const admin = { id: 'admin', role: UserRole.ADMIN };
      const brand = { id: 'brand', role: UserRole.BRAND };
      await expect(code(service.open('file-1', owner))).resolves.toBe('ok');
      await expect(code(service.open('file-1', admin))).resolves.toBe('ok');
      await expect(code(service.open('file-1', brand))).resolves.toBe(
        `404 ${ErrorCode.FILE_NOT_FOUND}`,
      );
      await expect(code(service.open('file-1', null))).resolves.toBe(
        `401 ${ErrorCode.UNAUTHORIZED}`,
      );
      expect(storage.read).toHaveBeenCalledTimes(2);
    });

    it('answers a missing file like a forbidden one', async () => {
      files.findOne.mockResolvedValue(null);
      await expect(
        code(service.open('file-1', { id: 'u', role: UserRole.BRAND })),
      ).resolves.toBe(`404 ${ErrorCode.FILE_NOT_FOUND}`);
      await expect(code(service.open('file-1', null))).resolves.toBe(
        `401 ${ErrorCode.UNAUTHORIZED}`,
      );
    });
  });

  describe('addPortfolioImage', () => {
    it('refuses a non-image before touching storage or the database', async () => {
      await expect(
        service.addPortfolioImage('owner', {
          buffer: Buffer.from('<svg/>'),
          size: 6,
        }),
      ).rejects.toMatchObject({
        status: 415,
        response: expect.objectContaining({
          code: ErrorCode.UPLOAD_UNSUPPORTED_TYPE,
        }),
      });
      await expect(
        service.addPortfolioImage('owner', undefined),
      ).rejects.toMatchObject({ status: 400 });
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(storage.put).not.toHaveBeenCalled();
    });

    it(`refuses a seventh image`, async () => {
      manager.find.mockResolvedValue(
        Array.from({ length: MAX_PORTFOLIO_IMAGES }, (_, i) => ({
          id: `f${i}`,
          position: i,
        })),
      );
      await expect(
        service.addPortfolioImage('owner', { buffer: PNG, size: PNG.length }),
      ).rejects.toMatchObject({
        status: 409,
        response: expect.objectContaining({ code: ErrorCode.PORTFOLIO_FULL }),
      });
      expect(storage.put).not.toHaveBeenCalled();
    });

    it('stores the image with a generated key after the last position', async () => {
      manager.find.mockResolvedValue([{ id: 'f0', position: 3 }]);
      await expect(
        service.addPortfolioImage('owner', { buffer: PNG, size: PNG.length }),
      ).resolves.toEqual({ id: 'file-new' });
      const saved = manager.save.mock.calls[0][0];
      expect(saved).toMatchObject({
        ownerId: 'owner',
        kind: FileKind.PORTFOLIO,
        mimeType: 'image/png',
        position: 4,
      });
      expect(saved.storageKey).toMatch(/^[0-9a-f-]{36}\.png$/);
      expect(storage.put).toHaveBeenCalledWith(saved.storageKey, PNG);
    });

    it('removes the written bytes when the database insert fails', async () => {
      manager.find.mockResolvedValue([]);
      manager.save.mockRejectedValueOnce(new Error('db down'));
      await expect(
        service.addPortfolioImage('owner', { buffer: PNG, size: PNG.length }),
      ).rejects.toThrow('db down');
      const [key] = storage.put.mock.calls[0] as unknown as [string];
      expect(storage.remove).toHaveBeenCalledWith(key);
    });
  });
});
