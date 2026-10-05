import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Readable } from 'stream';
import { FileKind, StoredFile } from './entities/stored-file.entity';
import { StorageService } from './storage/storage.service';
import { newStorageKey } from './storage/local-disk.storage';
import { detectImageType } from './image-type';
import { Profile } from '../profiles/entities/profile.entity';
import { UserRole } from '../users/entities/user.entity';
import { apiError, ErrorCode } from '../common/errors/error-codes';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PORTFOLIO_IMAGES = 6;

/** What Multer hands over (memory storage). */
export interface UploadedImage {
  buffer: Buffer;
  size: number;
}

export interface FileViewer {
  id: string;
  role: UserRole;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(StoredFile)
    private readonly files: Repository<StoredFile>,
    private readonly storage: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Checks the bytes, writes them to storage and records the file inside
   * `manager`'s transaction. If the transaction later fails, the caller's
   * catch must call `discard()` with the returned key.
   */
  async saveImage(
    manager: EntityManager,
    ownerId: string,
    kind: FileKind,
    upload: UploadedImage | undefined,
    position: number | null = null,
  ): Promise<StoredFile> {
    const type = this.checkImage(upload);
    const storageKey = newStorageKey(type.ext);
    await this.storage.put(storageKey, upload.buffer);
    try {
      return await manager.save(
        manager.create(StoredFile, {
          ownerId,
          kind,
          mimeType: type.mimeType,
          size: upload.size,
          storageKey,
          position,
        }),
      );
    } catch (error) {
      await this.discard(storageKey);
      throw error;
    }
  }

  /** Throws the client error for a missing or non-image upload. */
  checkImage(upload: UploadedImage | undefined) {
    if (!upload?.buffer?.length) {
      throw new BadRequestException(
        apiError(ErrorCode.UPLOAD_MISSING, 'Attach an image file'),
      );
    }
    const type = detectImageType(upload.buffer);
    if (!type) {
      throw new UnsupportedMediaTypeException(
        apiError(
          ErrorCode.UPLOAD_UNSUPPORTED_TYPE,
          'Only JPEG, PNG and WebP images are accepted',
        ),
      );
    }
    return type;
  }

  /** Removes stored bytes; failures are logged, not thrown (cleanup path). */
  async discard(storageKey: string): Promise<void> {
    try {
      await this.storage.remove(storageKey);
    } catch (error) {
      this.logger.error(`Could not remove ${storageKey}: ${String(error)}`);
    }
  }

  // --- Portfolio -----------------------------------------------------------

  async addPortfolioImage(
    userId: string,
    upload: UploadedImage | undefined,
  ): Promise<{ id: string }> {
    // Reject a bad file before taking any lock.
    this.checkImage(upload);
    let saved: StoredFile | undefined;
    try {
      return await this.dataSource.transaction(async (manager) => {
        // Serialise uploads of one creator so the limit holds under races.
        await manager
          .createQueryBuilder(Profile, 'profile')
          .setLock('pessimistic_write')
          .where('profile.user_id = :userId', { userId })
          .getOneOrFail();
        const existing = await manager.find(StoredFile, {
          where: { ownerId: userId, kind: FileKind.PORTFOLIO },
          select: { id: true, position: true },
        });
        if (existing.length >= MAX_PORTFOLIO_IMAGES) {
          throw new ConflictException(
            apiError(
              ErrorCode.PORTFOLIO_FULL,
              `A portfolio holds at most ${MAX_PORTFOLIO_IMAGES} images`,
            ),
          );
        }
        const position =
          Math.max(-1, ...existing.map((file) => file.position ?? 0)) + 1;
        saved = await this.saveImage(
          manager,
          userId,
          FileKind.PORTFOLIO,
          upload,
          position,
        );
        return { id: saved.id };
      });
    } catch (error) {
      // The row rolled back with the transaction; drop the orphaned bytes.
      if (saved) await this.discard(saved.storageKey);
      throw error;
    }
  }

  async listPortfolio(userId: string): Promise<{ id: string }[]> {
    const files = await this.files.find({
      where: { ownerId: userId, kind: FileKind.PORTFOLIO },
      order: { position: 'ASC', createdAt: 'ASC' },
      select: { id: true },
    });
    return files.map(({ id }) => ({ id }));
  }

  /** Portfolio image ids per owner, in order; one query for a whole list. */
  async portfolioIdsFor(userIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (!userIds.length) return result;
    const files = await this.files.find({
      where: { ownerId: In(userIds), kind: FileKind.PORTFOLIO },
      order: { position: 'ASC', createdAt: 'ASC' },
      select: { id: true, ownerId: true },
    });
    for (const file of files) {
      const ids = result.get(file.ownerId) ?? [];
      if (ids.length < MAX_PORTFOLIO_IMAGES) ids.push(file.id);
      result.set(file.ownerId, ids);
    }
    return result;
  }

  async removePortfolioImage(userId: string, fileId: string): Promise<void> {
    const file = await this.files.findOne({
      where: { id: fileId, ownerId: userId, kind: FileKind.PORTFOLIO },
    });
    if (!file) throw this.notFound();
    await this.files.delete({ id: file.id });
    await this.discard(file.storageKey);
  }

  // --- Serving -------------------------------------------------------------

  /**
   * Portfolio images are public. Anything else only reaches its owner and
   * admins: an anonymous caller gets 401 (so the client refreshes its token),
   * anyone else 404, so file ids reveal nothing.
   */
  async open(
    fileId: string,
    viewer: FileViewer | null,
  ): Promise<{ file: StoredFile; stream: Readable }> {
    const file = await this.files.findOne({ where: { id: fileId } });
    if (file?.kind !== FileKind.PORTFOLIO) {
      if (!viewer) {
        throw new UnauthorizedException(
          apiError(ErrorCode.UNAUTHORIZED, 'Log in to view this file'),
        );
      }
      if (
        !file ||
        (file.ownerId !== viewer.id && viewer.role !== UserRole.ADMIN)
      ) {
        throw this.notFound();
      }
    }
    try {
      return { file, stream: await this.storage.read(file.storageKey) };
    } catch (error) {
      this.logger.error(`Missing bytes for file ${file.id}: ${String(error)}`);
      throw this.notFound();
    }
  }

  private notFound() {
    return new NotFoundException(
      apiError(ErrorCode.FILE_NOT_FOUND, 'File not found'),
    );
  }
}
