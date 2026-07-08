import { Column, Entity, JoinColumn, ManyToOne, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Wallet } from './wallet.entity';


export enum TransactionType{
    DEPOSIT = 'DEPOSIT',
    WITHDRAW = 'WITHDRAW',
    BET = 'BET',
    PAYOUT = 'PAYOUT',
    // House rake collected by the market creator (admin) on each resolution.
    COMMISSION = 'COMMISSION',
    // Initial liquidity the admin funds from their wallet when creating a market.
    MARKET_SEED = 'MARKET_SEED',
    // ₳ granted for real 42 progress (level), at signup and on level-ups.
    SCHOOL42_REWARD = 'SCHOOL42_REWARD',
    // ₳ granted for platform engagement (daily streak, quests).
    ENGAGEMENT_REWARD = 'ENGAGEMENT_REWARD'
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