import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../profiles/entities/profile.entity';

export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

@Entity()
export class Match {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The unique identifier of the match' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Summer Campaign 2024', description: 'The name of the campaign' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Fashion', description: 'The category of the campaign' })
  @Column()
  category: string;

  @ApiProperty({ example: '2024-06-01', description: 'The start date of the campaign' })
  @Column()
  startDate: Date;

  @ApiProperty({ example: '2024-08-31', description: 'The end date of the campaign' })
  @Column()
  endDate: Date;

  @ApiProperty({ example: 1000, description: 'The number of clicks for this campaign' })
  @Column({ default: 0 })
  clicks: number;

  @ApiProperty({ example: 50000, description: 'The number of impressions for this campaign' })
  @Column({ default: 0 })
  impressions: number;

  @ApiProperty({ example: 2.5, description: 'The engagement rate for this campaign' })
  @Column({ type: 'float', default: 0 })
  engagementRate: number;

  @ApiProperty({ example: 100, description: 'The follower growth for this campaign' })
  @Column({ default: 0 })
  followerGrowth: number;

  @ApiProperty({ enum: MatchStatus, example: MatchStatus.PENDING, description: 'The status of the match' })
  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile)
  brand: Profile;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile)
  influencer: Profile;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The creation date of the match' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The last update date of the match' })
  @UpdateDateColumn()
  updatedAt: Date;
}