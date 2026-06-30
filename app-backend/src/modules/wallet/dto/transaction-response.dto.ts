import { TransactionStatus, TransactionType } from "../entities/transaction.entity";

export class TransactionResponseDto {
    id!: string;
    idWallet!: string;
    amount!: number;
    type!: TransactionType;
    status!: TransactionStatus;
    balanceBefore!: number;
    balanceAfter!: number;
    description!: string;
}