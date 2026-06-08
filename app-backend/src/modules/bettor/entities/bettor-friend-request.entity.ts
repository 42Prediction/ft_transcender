import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Bettor } from './bettor.entity';

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('bettor_friend_requests')
export class BettorFriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Bettor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: Bettor;

  @ManyToOne(() => Bettor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver!: Bettor;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status!: RequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}