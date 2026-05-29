import { IsOptional, IsString, IsEnum, IsUrl, IsArray, IsObject, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { ProfileType } from '../entities/profile.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SocialMediaType } from '../entities/social-media.entity';

export class SocialMediaDto {
  @ApiProperty({ enum: SocialMediaType, example: SocialMediaType.INSTAGRAM, description: 'The type of social media platform' })
  @IsEnum(SocialMediaType)
  type: SocialMediaType;

  @ApiProperty({ example: 'https://instagram.com/username', description: 'The URL to the social media profile' })
  @IsUrl()
  url: string;

  @ApiProperty({ example: 'username', description: 'The username on the platform', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 10000, description: 'Number of followers', required: false })
  @IsOptional()
  @IsNumber()
  followers?: number;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'John', description: 'The first name of the user', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the user', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'This is my bio...', description: 'The biography of the user', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'The URL to the user\'s avatar', required: false })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiProperty({ example: '25-34', description: 'Age range of the user', required: false })
  @IsOptional()
  @IsString()
  ageRange?: string;

  @ApiProperty({ example: 'Male', description: 'Gender of the user', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: 'New York', description: 'Location of the user', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: ['Fashion', 'Beauty'], description: 'Interests of the user', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiProperty({ example: ['Fashion', 'Beauty'], description: 'Categories the user specializes in', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiProperty({ example: true, description: 'Whether the user is subscribed to new order notifications', required: false })
  @IsOptional()
  @IsBoolean()
  isSubscribedToOrders?: boolean;

  @ApiProperty({ type: [SocialMediaDto], description: 'Social media links', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto[];

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

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