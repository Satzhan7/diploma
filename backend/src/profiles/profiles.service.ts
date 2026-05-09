import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, ProfileType } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from '../users/users.service';
import { SocialMedia } from './entities/social-media.entity';

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
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const profile = this.profilesRepository.create({
      type,
      user,
    });

    return this.profilesRepository.save(profile);
  }

  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['socialMedia']
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user with ID ${userId} not found`);
    }

    return profile;
  }

  async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({ 
      where: { id },
      relations: ['socialMedia']
    });
    
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
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
      profile.socialMedia = socialMedia.map(mediaDto => {
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

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    const profileId = profile.id;
    
    return this.update(profileId, updateProfileDto);
  }

  async findInfluencersForBrand(brandUserId: string, filters: any = {}): Promise<Profile[]> {
    // Get brand profile to access preferences
    const brandProfile = await this.findByUserId(brandUserId);
    
    // Build query based on brand preferences and provided filters
    const queryBuilder = this.profilesRepository.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.type = :type', { type: ProfileType.INFLUENCER });
    
    // Apply filters if provided
    if (filters.niches && filters.niches.length > 0) {
      queryBuilder.andWhere('profile.niches && :niches', { niches: filters.niches });
    }
    
    if (filters.minFollowers) {
      queryBuilder.andWhere('profile.followersCount >= :minFollowers', { minFollowers: filters.minFollowers });
    }
    
    if (filters.maxFollowers) {
      queryBuilder.andWhere('profile.followersCount <= :maxFollowers', { maxFollowers: filters.maxFollowers });
    }
    
    if (filters.platforms && filters.platforms.length > 0) {
      queryBuilder.andWhere('profile.socialMediaPlatforms && :platforms', { platforms: filters.platforms });
    }
    
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      queryBuilder.andWhere('profile.contentTypes && :contentTypes', { contentTypes: filters.contentTypes });
    }
    
    if (filters.locations && filters.locations.length > 0) {
      queryBuilder.andWhere('profile.location IN (:...locations)', { locations: filters.locations });
    }
    
    return queryBuilder.getMany();
  }

  async findBrandsForInfluencer(influencerUserId: string, filters: any = {}): Promise<Profile[]> {
    // Get influencer profile to access preferences
    const influencerProfile = await this.findByUserId(influencerUserId);
    
    // Build query based on influencer preferences and provided filters
    const queryBuilder = this.profilesRepository.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.type = :type', { type: ProfileType.BRAND });
    
    // Apply filters if provided
    if (filters.industries && filters.industries.length > 0) {
      queryBuilder.andWhere('profile.industry IN (:...industries)', { industries: filters.industries });
    }
    
    if (filters.productCategories && filters.productCategories.length > 0) {
      queryBuilder.andWhere('profile.productCategories && :categories', { categories: filters.productCategories });
    }
    
    return queryBuilder.getMany();
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
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
  }

  // Метод для поиска инфлюенсеров по категориям
  async findInfluencersByCategories(categories: string[], limit: number = 10): Promise<Profile[]> {
    const queryBuilder = this.profilesRepository
      .createQueryBuilder('profile')
      .where('profile.type = :type', { type: ProfileType.INFLUENCER })
      .leftJoinAndSelect('profile.user', 'user');
    
    if (categories && categories.length > 0) {
      // Используем ARRAY_OVERLAP для поиска профилей, у которых есть хотя бы одна общая категория
      queryBuilder.andWhere('profile.categories && :categories', { 
        categories: categories 
      });
    }
    
    return queryBuilder
      .orderBy('user.name', 'ASC')
      .limit(limit)
      .getMany();
  }
  
  // Метод для поиска брендов по категориям
  async findBrandsByCategories(categories: string[], limit: number = 10): Promise<Profile[]> {
    const queryBuilder = this.profilesRepository
      .createQueryBuilder('profile')
      .where('profile.type = :type', { type: ProfileType.BRAND })
      .leftJoinAndSelect('profile.user', 'user');
    
    if (categories && categories.length > 0) {
      // Используем ARRAY_OVERLAP для поиска профилей, у которых есть хотя бы одна общая категория
      queryBuilder.andWhere('profile.categories && :categories', { 
        categories: categories 
      });
    }
    
    return queryBuilder
      .orderBy('user.name', 'ASC')
      .limit(limit)
      .getMany();
  }
}