import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

export enum CollaborationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Collaboration {
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

  @ManyToOne(() => Order, { nullable: true })
  order: Order;

  @Column({ nullable: true })
  orderId: string;

  @Column({
    type: 'enum',
    enum: CollaborationStatus,
    default: CollaborationStatus.ACTIVE,
  })
  status: CollaborationStatus;

  @Column({ nullable: true })
  completionDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 