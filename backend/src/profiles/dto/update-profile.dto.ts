import { IsOptional, IsString, IsEnum, IsUrl, IsArray, IsObject, IsNumber } from 'class-validator';
import { ProfileType } from '../entities/profile.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(ProfileType)
  type?: ProfileType;

  // Brand-specific fields
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsArray()
  productCategories?: string[];

  // Influencer-specific fields
  @IsOptional()
  @IsArray()
  niches?: string[];

  @IsOptional()
  @IsArray()
  socialMediaPlatforms?: string[];

  @IsOptional()
  @IsObject()
  socialMediaHandles?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  followersCount?: number;

  @IsOptional()
  @IsObject()
  demographics?: {
    ageRanges: string[];
    genders: string[];
    locations: string[];
  };

  @IsOptional()
  @IsArray()
  contentTypes?: string[];

  @IsOptional()
  @IsObject()
  metrics?: {
    averageEngagementRate: number;
    averageViews: number;
    averageLikes: number;
    averageComments: number;
  };

  @IsOptional()
  @IsArray()
  languages?: string[];

  @IsOptional()
  @IsObject()
  preferences?: {
    collaborationTypes: string[];
    compensationTypes: string[];
    minimumCompensation: number;
  };
}