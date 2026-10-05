import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { StoredFile } from '../../files/entities/stored-file.entity';
import { User } from '../../users/entities/user.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * A creator's latest stats claim. One row per creator: resubmitting replaces
 * the claim and the screenshot; the audit log keeps the review history.
 */
@Entity('creator_verifications')
export class CreatorVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Unique through the one-to-one join column.
  @Column({ type: 'uuid' })
  profileId: string;

  @OneToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: Profile;

  @Column({ type: 'int' })
  followers: number;

  /** Percent, e.g. 6.8. */
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  engagementRate: number;

  @Column({ type: 'uuid', nullable: true })
  screenshotId: string | null;

  @ManyToOne(() => StoredFile, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'screenshotId' })
  screenshot: StoredFile | null;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectReason: string | null;

  @Column({ type: 'timestamptz' })
  submittedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
