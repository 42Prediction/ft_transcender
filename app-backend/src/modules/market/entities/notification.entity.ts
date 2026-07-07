import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bettor } from '../../bettor/entities/bettor.entity';

export enum NotificationType {
  // A market the bettor holds a position in was resolved (won or lost).
  BET_RESOLVED = 'bet_resolved',
  // A market the bettor holds a position in was cancelled — stake refunded.
  BET_CANCELLED = 'bet_cancelled',
  // The bettor was @mentioned in a market chat.
  CHAT_MENTION = 'chat_mention',
}

@Entity('notifications')
// Recipient inbox is always read newest-first for one bettor.
@Index('IDX_notifications_bettor_created', ['bettorId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bettor_id' })
  bettorId!: string;

  @ManyToOne(() => Bettor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bettor_id' })
  bettor!: Bettor;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  // Link target: the market this notification refers to (chat or bet).
  @Column({ name: 'market_id', type: 'uuid', nullable: true })
  marketId?: string | null;

  // Type-specific payload rendered by the client (project, outcome, amounts,
  // the mentioning nick, a message excerpt, …).
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown> | null;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
