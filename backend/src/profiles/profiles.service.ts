import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, ProfileType } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from '../users/users.service';

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
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user with ID ${userId} not found`);
    }

    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    
    // Update profile with new data
    Object.assign(profile, updateProfileDto);
    
    return this.profilesRepository.save(profile);
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

  async update(id: string, profile: Partial<Profile>): Promise<Profile> {
    await this.profilesRepository.update(id, profile);
    return this.profilesRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.profilesRepository.delete(id);
  }
}