import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/** The one active sign-up code of a user; replaced on resend, deleted once used. */
@Entity('email_verification')
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Unique through the one-to-one join column: one active code per user.
  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** SHA-256 hex of the 6-digit code; the code itself is never stored. */
  @Column({ type: 'char', length: 64 })
  codeHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  /** When the code was last emailed; drives the resend cooldown. */
  @Column({ type: 'timestamptz' })
  sentAt: Date;
}
