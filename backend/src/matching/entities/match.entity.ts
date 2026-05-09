import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

// Define structure for the stats object
export interface MatchStats {
  clicks?: number;
  impressions?: number;
  engagementRate?: number; // Kept for potential use, though also a direct column
  followerGrowth?: number;
}

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  brand: User;

  @Column()
  brandId: string;

  @ManyToOne(() => User)
  influencer: User;

  @Column()
  influencerId: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate?: Date;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @Column({ nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  stats?: MatchStats;

  @Column({ default: 0 })
  engagementRate: number;

  @Column({ default: 0 })
  conversionRate: number;

  @Column({ default: 0 })
  clickThroughRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}