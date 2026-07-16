import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Bettor } from '../../bettor/entities/bettor.entity';

@Entity('wallet')
export class Wallet{
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({name: 'id_bettor',type: 'uuid', unique:true})
    idBettor!: string;

    @OneToOne(() => Bettor)
    @JoinColumn({name: 'id_bettor'})
    bettor!: Bettor;

    @Column({type: 'decimal', precision: 18, scale: 2, default: 0})
    balance!: number;

    @OneToMany(() => Transaction, (transaction) => transaction.wallet)
    transactions!: Transaction[];

    @CreateDateColumn({name: 'created_at'})
    createdAt!: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt!: Date;
}