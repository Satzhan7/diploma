import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, ProfileType } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from '../users/users.service';
import { SocialMedia } from './entities/social-media.entity';
import { PublicUser, toPublicUser } from '../users/public-user';
import { apiError, ErrorCode } from '../common/errors/error-codes';

export type PublicProfile = Profile & { user: PublicUser };

// Swap the loaded owner for its public projection (no email or hashes).
// Keeps the Profile instance so class-transformer getters still apply.
function withPublicUser(profile: Profile): PublicProfile {
  return Object.assign(profile, {
    user: profile.user ? toPublicUser(profile.user) : undefined,
  });
}

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    private usersService: UsersService,
  ) {}

  async createProfile(userId: string, type: ProfileType): Promise<Profile> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(
        apiError(ErrorCode.USER_NOT_FOUND, `User with ID ${userId} not found`),
      );
    }

    const profile = this.profilesRepository.create({
      type,
      user,
    });

    return this.profilesRepository.save(profile);
  }

  /** Used while sign-up is unconfirmed, when the role may still change. */
  async setType(userId: string, type: ProfileType): Promise<void> {
    const profile = await this.findByUserId(userId);
    if (profile.type !== type) {
      await this.profilesRepository.update(profile.id, { type });
    }
  }

  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['socialMedia'],
    });

    if (!profile) {
      throw new NotFoundException(
        apiError(
          ErrorCode.PROFILE_NOT_FOUND,
          `Profile for user with ID ${userId} not found`,
        ),
      );
    }

    return profile;
  }

  // Profile plus its owner's public identity (no email or hashes), for
  // viewing another user's profile page.
  async findPublicByUserId(userId: string): Promise<PublicProfile> {
    const profile = await this.profilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['socialMedia', 'user'],
    });

    if (!profile) {
      throw new NotFoundException(
        apiError(
          ErrorCode.PROFILE_NOT_FOUND,
          `Profile for user with ID ${userId} not found`,
        ),
      );
    }

    return withPublicUser(profile);
  }

  async update(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { id },
      relations: ['socialMedia'],
    });

    if (!profile) {
      throw new NotFoundException(
        apiError(
          ErrorCode.PROFILE_NOT_FOUND,
          `Profile with ID ${id} not found`,
        ),
      );
    }

    // Handle socialMedia separately
    const { socialMedia, ...profileData } = updateProfileDto;

    // Update profile with new data (except socialMedia)
    Object.assign(profile, profileData);

    // Handle social media if provided
    if (socialMedia && socialMedia.length > 0) {
      // Remove existing social media entries if any
      if (profile.socialMedia && profile.socialMedia.length > 0) {
        await this.profilesRepository.manager.remove(profile.socialMedia);
      }

      // Create new social media entries
      profile.socialMedia = socialMedia.map((mediaDto) => {
        const socialMediaEntity = new SocialMedia();
        socialMediaEntity.type = mediaDto.type;
        socialMediaEntity.url = mediaDto.url;
        socialMediaEntity.username = mediaDto.username;
        socialMediaEntity.followers = mediaDto.followers;
        socialMediaEntity.profile = profile;
        return socialMediaEntity;
      });
    }

    return this.profilesRepository.save(profile);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    const profileId = profile.id;

    return this.update(profileId, updateProfileDto);
  }

  async findAll(): Promise<Profile[]> {
    return this.profilesRepository.find();
  }

  async findOne(id: string): Promise<Profile> {
    return this.profilesRepository.findOne({ where: { id } });
  }

  async create(profile: Partial<Profile>): Promise<Profile> {
    const newProfile = this.profilesRepository.create(profile);
    return this.profilesRepository.save(newProfile);
  }

  async remove(id: string): Promise<void> {
    await this.profilesRepository.delete(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.profilesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(
        apiError(
          ErrorCode.PROFILE_NOT_FOUND,
          `Profile with ID ${id} not found`,
        ),
      );
    }
  }
}
