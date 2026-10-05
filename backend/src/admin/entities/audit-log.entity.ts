import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/** Who changed what: one row per admin action, written in its transaction. */
@Entity('audit_log')
@Index(['targetType', 'targetId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorId' })
  actor: User | null;

  /** e.g. `verification.approve`, `plan.set`. */
  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'varchar', length: 32 })
  targetType: string;

  @Column({ type: 'uuid' })
  targetId: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  details: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
