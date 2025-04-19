import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProfileType {
  BRAND = 'brand',
  INFLUENCER = 'influencer',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  websiteUrl: string;

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

  @Column({ type: 'simple-array', nullable: true })
  productCategories: string[];

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

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}