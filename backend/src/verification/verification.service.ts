import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { FileKind, StoredFile } from '../files/entities/stored-file.entity';
import { FilesService, UploadedImage } from '../files/files.service';
import {
  CreatorVerification,
  VerificationStatus,
} from './entities/creator-verification.entity';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { MyVerificationView, toMyVerificationView } from './verification-view';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(CreatorVerification)
    private readonly verifications: Repository<CreatorVerification>,
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    private readonly filesService: FilesService,
    private readonly dataSource: DataSource,
  ) {}

  async mine(userId: string): Promise<MyVerificationView> {
    const profile = await this.profiles.findOneOrFail({
      where: { user: { id: userId } },
      select: { id: true, verifiedAt: true },
    });
    const row = await this.verifications.findOne({
      where: { profileId: profile.id },
    });
    return toMyVerificationView(row, profile.verifiedAt);
  }

  /**
   * A new claim replaces the previous one and its screenshot, waits for an
   * admin, and clears the badge until then.
   */
  async submit(
    userId: string,
    dto: SubmitVerificationDto,
    upload: UploadedImage | undefined,
  ): Promise<MyVerificationView> {
    this.filesService.checkImage(upload);
    let saved: StoredFile | undefined;
    let replaced: StoredFile | null = null;
    let result: MyVerificationView;
    try {
      result = await this.dataSource.transaction(async (manager) => {
        // One submission per creator at a time; also serialises with approve.
        const profile = await manager
          .createQueryBuilder(Profile, 'profile')
          .setLock('pessimistic_write')
          .where('profile.user_id = :userId', { userId })
          .getOneOrFail();
        const existing = await manager.findOne(CreatorVerification, {
          where: { profileId: profile.id },
        });
        saved = await this.filesService.saveImage(
          manager,
          userId,
          FileKind.VERIFICATION,
          upload,
        );
        const row = manager.create(CreatorVerification, {
          ...(existing ?? {}),
          profileId: profile.id,
          followers: dto.followers,
          engagementRate: dto.engagementRate,
          screenshotId: saved.id,
          status: VerificationStatus.PENDING,
          rejectReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedById: null,
        });
        await manager.save(row);
        await manager.update(Profile, profile.id, { verifiedAt: null });
        if (existing?.screenshotId) {
          replaced = await manager.findOne(StoredFile, {
            where: { id: existing.screenshotId },
          });
          if (replaced) await manager.delete(StoredFile, { id: replaced.id });
        }
        return toMyVerificationView(row, null);
      });
    } catch (error) {
      if (saved) await this.filesService.discard(saved.storageKey);
      throw error;
    }
    if (replaced) await this.filesService.discard(replaced.storageKey);
    return result;
  }
}
