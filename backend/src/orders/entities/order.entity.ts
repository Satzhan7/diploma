import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../profiles/entities/profile.entity';
import { User } from '../../users/entities/user.entity';
import { OrderApplication } from './order-application.entity';

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
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The unique identifier for the order' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Promote our new product on Instagram', description: 'The title of the order' })
  @Column()
  title: string;

  @ApiProperty({ example: 'We are looking for influencers to promote our new skincare line...', description: 'Detailed description of the order' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 1000, description: 'The budget for the order in USD' })
  @Column()
  budget: number;

  @ApiProperty({ example: 'Beauty', description: 'The category of the order' })
  @Column()
  category: string;

  @ApiProperty({ example: 'Post 3 Instagram stories and 1 feed post...', description: 'Specific requirements for the order' })
  @Column({ type: 'text' })
  requirements: string;

  @ApiProperty({ example: '2024-05-01', description: 'The deadline for the order' })
  @Column()
  deadline: string;

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

  @ManyToOne(() => User, user => user.orders)
  brandUser: User;

  @ApiProperty({ type: () => [OrderApplication] })
  @OneToMany(() => OrderApplication, application => application.order, { cascade: true })
  applications: OrderApplication[];
} 