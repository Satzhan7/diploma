import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SocialMedia } from './social-media.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

export enum ProfileType {
  BRAND = 'brand',
  INFLUENCER = 'influencer',
}

@Entity('profiles')
export class Profile {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The unique identifier for the profile' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  displayName: string;

  @ApiProperty({ example: 'This is my bio...', description: 'The biography of the user', required: false })
  @Column({ type: 'text', nullable: true })
  bio: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'The URL to the user\'s avatar', required: false })
  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  websiteUrl: string;

  @ApiProperty({ example: '25-34', description: 'Age range of the user', required: false })
  @Column({ nullable: true })
  ageRange: string;

  @ApiProperty({ example: 'Male', description: 'Gender of the user', required: false })
  @Column({ nullable: true })
  gender: string;

  @ApiProperty({ example: 'New York', description: 'Location of the user', required: false })
  @Column({ nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: ProfileType,
    default: ProfileType.INFLUENCER,
  })
  type: ProfileType;

  // Brand-specific fields
  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  industry: string;

  @ApiProperty({ example: ['Fashion', 'Beauty'], description: 'Interests of the user', required: false })
  @Column('simple-array', { nullable: true })
  interests: string[];

  @ApiProperty({ example: ['Fashion', 'Beauty'], description: 'Categories the user specializes in', required: false })
  @Column('simple-array', { nullable: true })
  categories: string[];

  // Influencer-specific fields
  @Column({ type: 'simple-array', nullable: true })
  niches: string[];

  @Column({ type: 'simple-array', nullable: true })
  socialMediaPlatforms: string[];

  @Column({ type: 'jsonb', nullable: true })
  socialMediaHandles: Record<string, string>;

  @Column({ type: 'int', nullable: true })
  followersCount: number;

  @Column({ type: 'jsonb', nullable: true })
  demographics: {
    ageRanges: string[];
    genders: string[];
    locations: string[];
  };

  @Column({ type: 'simple-array', nullable: true })
  contentTypes: string[];

  @Column({ type: 'jsonb', nullable: true })
  metrics: {
    averageEngagementRate: number;
    averageViews: number;
    averageLikes: number;
    averageComments: number;
  };

  @Column({ type: 'simple-array', nullable: true })
  languages: string[];

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    collaborationTypes: string[];
    compensationTypes: string[];
    minimumCompensation: number;
  };

  @ApiProperty({ example: true, description: 'Whether the user is subscribed to new order notifications', required: false })
  @Column({ default: false })
  isSubscribedToOrders: boolean;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The creation date of the profile' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The last update date of the profile' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ type: () => [SocialMedia] })
  @OneToMany(() => SocialMedia, socialMedia => socialMedia.profile, { cascade: true })
  socialMedia: SocialMedia[];

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.socialMedia) return [];
    return obj.socialMedia.map(media => ({
      id: media.id,
      type: media.type,
      url: media.url,
      username: media.username,
      followers: media.followers,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt
    }));
  })
  get socialMediaData() {
    return this.socialMedia;
  }
}