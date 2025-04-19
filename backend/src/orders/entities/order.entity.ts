import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../profiles/entities/profile.entity';

export enum OrderStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('orders')
export class Order {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The unique identifier of the order' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Summer Campaign', description: 'The title of the order' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Looking for fashion influencers...', description: 'Detailed description of the order' })
  @Column('text')
  description: string;

  @ApiProperty({ example: 1000, description: 'Budget for the order in USD' })
  @Column('decimal', { precision: 10, scale: 2 })
  budget: number;

  @ApiProperty({ example: 'fashion', description: 'Category of the order' })
  @Column()
  category: string;

  @ApiProperty({ example: 'Must have at least 10k followers...', description: 'Specific requirements for influencers' })
  @Column('text')
  requirements: string;

  @ApiProperty({ example: '2024-12-31', description: 'Deadline for the order' })
  @Column()
  deadline: Date;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.OPEN, description: 'The status of the order' })
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.OPEN,
  })
  status: OrderStatus;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'brand_id' })
  brand: Profile;

  @Column({ name: 'brand_id' })
  brandId: string;

  @ApiProperty({ type: () => Profile })
  @ManyToOne(() => Profile, { nullable: true })
  @JoinColumn({ name: 'influencer_id' })
  influencer: Profile;

  @Column({ name: 'influencer_id', nullable: true })
  influencerId: string;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The creation date of the order' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The last update date of the order' })
  @UpdateDateColumn()
  updatedAt: Date;
} 