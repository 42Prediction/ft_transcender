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
 
  BET_RESOLVED = 'bet_resolved',

  BET_CANCELLED = 'bet_cancelled',

  CHAT_MENTION = 'chat_mention',
 
  FRIEND_REQUEST_RECEIVED = 'friend_request_received',

  FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
}

@Entity('notifications')

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

 
  @Column({ name: 'market_id', type: 'uuid', nullable: true })
  marketId?: string | null;

  
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown> | null;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
