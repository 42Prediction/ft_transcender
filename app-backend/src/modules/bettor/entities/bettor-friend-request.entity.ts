import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Bettor } from './bettor.entity';

// O enum define os três estados possíveis de um pedido na Base de Dados
export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('bettor_friend_requests')
export class BettorFriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Quem enviou o pedido
  @ManyToOne(() => Bettor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: Bettor;

  // Quem recebeu o pedido
  @ManyToOne(() => Bettor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver!: Bettor;

  // Estado atual do pedido (por defeito começa sempre como PENDING)
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status!: RequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}