import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bettor } from './bettor.entity';

@Entity('bettor_quests')
@Index('UQ_bettor_quest', ['bettorId', 'questKey'], { unique: true })
export class BettorQuest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bettor_id' })
  bettorId!: string;

  @ManyToOne(() => Bettor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bettor_id' })
  bettor!: Bettor;

  @Column({ name: 'quest_key' })
  questKey!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  reward!: number;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt!: Date;
}
