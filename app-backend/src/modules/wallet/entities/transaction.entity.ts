import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Wallet } from './wallet.entity';
import { PrimaryGeneratedColumn } from 'typeorm/browser';
import { CreateDateColumn } from 'typeorm/browser';


export enum TransactionType{
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
    DEPOSIT = 'DEPOSIT',
    WITHDRAW = 'WITHDRAW',
    BET = 'BET',
    PAYOUT = 'PAYOUT'
}

export enum TransactionStatus{
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    PENDING = 'PENDING'
}

@Entity('transaction')
export class Transaction{

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({name: 'id_wallet'})
    idWallet!: string;

    @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
    @JoinColumn({name: 'id_wallet'})
    wallet!: Wallet;

    @Column({type: 'decimal', precision: 18, scale: 2})
    amount!: number;

    @Column({type: 'enum', enum: TransactionType})
    type!: TransactionType

    @Column({type: 'enum', enum: TransactionStatus})
    status!: TransactionStatus;

    @Column({type: 'decimal', precision: 18, scale: 2, name: 'balance_before'})
    balanceBefore!: number;

    @Column({type: 'decimal', precision: 18, scale: 2, name: 'balance_after'})
    balanceAfter!: number;

    @Column({nullable: true})
    description!: string;

    @CreateDateColumn({name: 'created_at'})
    createdAt!: Date;


}