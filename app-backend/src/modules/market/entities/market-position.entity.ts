import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bettor } from '../../bettor/entities/bettor.entity';
import { Market } from './market.entity';

export enum BetSide {
  YES = 'YES',
  NO = 'NO',
}

@Entity('market_positions')
export class MarketPosition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'market_id' })
  marketId!: string;

  @ManyToOne(() => Market, (market) => market.positions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'market_id' })
  market!: Market;

  @Column({ name: 'bettor_id' })
  bettorId!: string;

  @ManyToOne(() => Bettor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bettor_id' })
  bettor!: Bettor;

  @Column({ type: 'enum', enum: BetSide })
  side!: BetSide;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  shares!: number;

  @Column({ name: 'entry_price', type: 'decimal', precision: 18, scale: 6 })
  entryPrice!: number;

  @Column({ name: 'payout', type: 'decimal', precision: 18, scale: 2, nullable: true })
  payout?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
