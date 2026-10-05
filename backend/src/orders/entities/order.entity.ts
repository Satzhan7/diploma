import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../profiles/entities/profile.entity';
import { OrderApplication } from './order-application.entity';
import {
  BriefCity,
  BriefFormat,
  BriefGoal,
  BriefLanguage,
  BriefPlatform,
} from '../brief-options';

export enum OrderStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The unique identifier for the order',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Promote our new product on Instagram',
    description: 'The title of the order',
  })
  @Column()
  title: string;

  @ApiProperty({
    example:
      'We are looking for influencers to promote our new skincare line...',
    description: 'Detailed description of the order',
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ enum: BriefGoal, required: false })
  @Column({ type: 'enum', enum: BriefGoal, nullable: true })
  goal: BriefGoal | null;

  @ApiProperty({ enum: BriefPlatform, required: false })
  @Column({ type: 'enum', enum: BriefPlatform, nullable: true })
  platform: BriefPlatform | null;

  @ApiProperty({ example: ['reel', 'stories'], required: false })
  @Column({ type: 'simple-array', nullable: true })
  formats: BriefFormat[] | null;

  @ApiProperty({ example: 'almaty', required: false })
  @Column({ type: 'varchar', nullable: true })
  city: BriefCity | null;

  @ApiProperty({ example: ['kk', 'ru'], required: false })
  @Column({ type: 'simple-array', nullable: true })
  languages: BriefLanguage[] | null;

  @ApiProperty({ example: 'food', required: false })
  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @ApiProperty({ example: 60000, description: 'Budget per creator, ₸' })
  @Column({ type: 'int', nullable: true })
  budgetMin: number | null;

  @ApiProperty({ example: 120000, description: 'Budget per creator, ₸' })
  @Column({ type: 'int', nullable: true })
  budgetMax: number | null;

  @ApiProperty({ example: '1 Reel + 3 Stories', required: false })
  @Column({ type: 'text', nullable: true })
  deliverables: string | null;

  @ApiProperty({
    example: 'Tag @cafe.daryn, show the pistachio croissant',
    description: 'What the post must include',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @ApiProperty({ example: '2026-10-15', description: 'Post by (YYYY-MM-DD)' })
  @Column({ type: 'date', nullable: true })
  postBy: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.OPEN,
    description: 'The status of the order',
  })
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT,
  })
  status: OrderStatus;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'brand_id' })
  @Index()
  brand: Profile;

  @Column({ name: 'brand_id' })
  brandId: string;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile, { nullable: true })
  @JoinColumn({ name: 'influencer_id' })
  @Index()
  influencer: Profile;

  @Column({ name: 'influencer_id', nullable: true })
  influencerId: string;

  @ApiProperty({
    example: '2024-04-19T09:00:00.000Z',
    description: 'The creation date of the order',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-04-19T09:00:00.000Z',
    description: 'The last update date of the order',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ type: () => [OrderApplication] })
  @OneToMany(() => OrderApplication, (application) => application.order, {
    cascade: true,
  })
  applications: OrderApplication[];
}
