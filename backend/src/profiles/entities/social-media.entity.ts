import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from './profile.entity';
import { Exclude, Expose } from 'class-transformer';

export enum SocialMediaType {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  THREADS = 'threads',
  LINKEDIN = 'linkedin',
}

@Entity()
export class SocialMedia {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The unique identifier for the social media link' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: SocialMediaType, example: SocialMediaType.INSTAGRAM, description: 'The type of social media platform' })
  @Column({
    type: 'enum',
    enum: SocialMediaType,
    default: SocialMediaType.INSTAGRAM,
  })
  type: SocialMediaType;

  @ApiProperty({ example: 'https://instagram.com/username', description: 'The URL to the social media profile' })
  @Column()
  url: string;

  @ApiProperty({ example: 'username', description: 'The username on the platform' })
  @Column({ nullable: true })
  username: string;

  @ApiProperty({ example: '10000', description: 'Number of followers', required: false })
  @Column({ nullable: true })
  followers: number;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The creation date of the social media link' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The last update date of the social media link' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Profile, profile => profile.socialMedia)
  profile: Profile;
  
  @Expose()
  get profileId() {
    return this.profile ? this.profile.id : null;
  }
} 