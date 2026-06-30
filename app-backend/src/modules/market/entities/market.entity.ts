import {
  Column,
  CreateDateColumn,
  Entity,
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
}

export enum MarketResolution {
  YES = 'YES',
  NO = 'NO',
}

export enum MarketCategory {
  COMMON_CORE = 'Common Core',
  EXAMS = 'Exams',
  RUSHES = 'Rushes',
  PISCINE = 'Piscine',
  PROJECTS = 'Projects',
  INTERNSHIPS = 'Internships',
  PEER_EVALS = 'Peer Evals',
}

@Entity('markets')
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'enum', enum: MarketResolution, nullable: true })
  resolution?: MarketResolution;

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
