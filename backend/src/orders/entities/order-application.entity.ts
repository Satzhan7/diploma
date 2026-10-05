import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

// A user may apply to an order only once. This is enforced at the database
// level as well as in the service so concurrent requests cannot bypass it.
@Entity()
@Unique('UQ_order_application_order_applicant', ['order', 'applicant'])
export class OrderApplication {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The unique identifier for the application',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'I would like to work on this project because...',
    description: 'The cover letter or message from the applicant',
  })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    example: 1000,
    description: 'The proposed price by the applicant',
  })
  @Column({ nullable: true })
  proposedPrice: number;

  @ApiProperty({
    enum: ApplicationStatus,
    example: ApplicationStatus.PENDING,
    description: 'The status of the application',
  })
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  // The brand's private shortlist (the Compare view). Creators never see it.
  @ApiProperty({ example: false })
  @Column({ default: false })
  shortlisted: boolean;

  @ApiProperty({
    example: '2024-04-19T09:00:00.000Z',
    description: 'The creation date of the application',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-04-19T09:00:00.000Z',
    description: 'The last update date of the application',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Order, (order) => order.applications)
  order: Order;

  // "orderId" leads the unique pair, so only the applicant needs its own index.
  @Index()
  @ManyToOne(() => User)
  applicant: User;
}
