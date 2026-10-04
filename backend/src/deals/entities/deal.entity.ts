import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../orders/entities/order.entity';
import { OrderApplication } from '../../orders/entities/order-application.entity';
import { Profile } from '../../profiles/entities/profile.entity';

export enum DealStatus {
  ACTIVE = 'active',
  PROOF_SUBMITTED = 'proof_submitted',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

// One deal per accepted application (docs/adr/0001-deal-pipeline.md). The
// terms are copied at acceptance so later brief edits do not change them.
@Entity('deals')
export class Deal {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Index()
  @Column()
  orderId: string;

  // One-to-one: the join column carries the unique constraint, so a retried
  // accept can never create a second deal for the same application.
  @OneToOne(() => OrderApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: OrderApplication;

  @Column()
  applicationId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandProfileId' })
  brandProfile: Profile;

  @Index()
  @Column()
  brandProfileId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorProfileId' })
  creatorProfile: Profile;

  @Index()
  @Column()
  creatorProfileId: string;

  @ApiProperty({ description: 'Agreed price in tenge' })
  @Column({ type: 'int' })
  agreedPrice: number;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  deliverables: string | null;

  @ApiProperty({ nullable: true, example: '2026-10-15' })
  @Column({ type: 'date', nullable: true })
  postBy: string | null;

  @ApiProperty({ enum: DealStatus })
  @Column({ type: 'enum', enum: DealStatus, default: DealStatus.ACTIVE })
  status: DealStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
