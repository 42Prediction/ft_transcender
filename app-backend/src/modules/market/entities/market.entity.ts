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

  CANCELLED = 'cancelled',
}

export enum MarketResolution {
  YES = 'YES',
  NO = 'NO',
}


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

  
  @Column({ name: 'exam_ends_at', type: 'timestamp', nullable: true })
  examEndsAt?: Date | null;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'enum', enum: MarketResolution, nullable: true })
  resolution?: MarketResolution;

 
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
