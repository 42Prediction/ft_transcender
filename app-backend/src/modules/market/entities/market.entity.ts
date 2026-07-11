import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bettor } from '../../bettor/entities/bettor.entity';
import { MarketPosition } from './market-position.entity';

export enum MarketStatus {
  LIVE = 'live',
  CLOSING = 'closing',
  NEW = 'new',
  RESOLVED = 'resolved',
  // Auto-generated exam markets are voided (bets refunded) when the cadet
  // deregisters from the exam before it ends.
  CANCELLED = 'cancelled',
}

export enum MarketResolution {
  YES = 'YES',
  NO = 'NO',
}

// The only markets this platform runs are 42 exam-rank predictions —
// deliberately no broader category scope (no Piscine/Projects/etc).
export enum MarketCategory {
  EXAM_02 = 'Exam 02',
  EXAM_03 = 'Exam 03',
  EXAM_04 = 'Exam 04',
  EXAM_05 = 'Exam 05',
  EXAM_06 = 'Exam 06',
}

@Entity('markets')
@Index('UQ_markets_exam_subject', ['examId', 'subjectLogin'], {
  unique: true,
  where: '"exam_id" IS NOT NULL',
})
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Set when this market was auto-generated from a 42 School exam; pairs with
  // subjectLogin to dedupe one market per (exam, cadet).
  @Column({ name: 'exam_id', type: 'varchar', nullable: true })
  examId?: string | null;

  @Column({ name: 'subject_login' })
  subjectLogin!: string;

  @Column({ name: 'subject_name' })
  subjectName!: string;

  @Column({ name: 'subject_avatar', type: 'text', nullable: true })
  subjectAvatar?: string;

  @Column()
  project!: string;

  @Column({ type: 'enum', enum: MarketCategory })
  category!: MarketCategory;

  @Column({ type: 'enum', enum: MarketStatus, default: MarketStatus.NEW })
  status!: MarketStatus;

  @Column({ name: 'yes_pool', type: 'decimal', precision: 18, scale: 2, default: 100 })
  yesPool!: number;

  @Column({ name: 'no_pool', type: 'decimal', precision: 18, scale: 2, default: 100 })
  noPool!: number;

  @Column({ name: 'closes_at' })
  closesAt!: Date;

  // Exam session end time (42's `endAt`) — only set for auto-generated exam
  // markets. Lets a human resolve manually once the session has genuinely
  // locked, without needing a live 42 call at resolve time.
  @Column({ name: 'exam_ends_at', type: 'timestamp', nullable: true })
  examEndsAt?: Date | null;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'enum', enum: MarketResolution, nullable: true })
  resolution?: MarketResolution;

  // Real 42 grade (0-125+) behind the resolution, when known — from the
  // published grade on auto-resolve, or entered by hand on a manual
  // post-exam-end resolve. Null for manually-created (non-exam) markets.
  @Column({ name: 'final_grade', type: 'decimal', precision: 6, scale: 2, nullable: true })
  finalGrade?: number | null;

  @Column({ name: 'creator_id' })
  creatorId!: string;

  @ManyToOne(() => Bettor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator!: Bettor;

  @OneToMany(() => MarketPosition, (pos) => pos.market)
  positions!: MarketPosition[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
