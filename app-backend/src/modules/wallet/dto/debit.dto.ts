import { TransactionType } from "../entities/transaction.entity";

export class DebitWalletDto {
    amount!: number;
    type!: TransactionType.WITHDRAW | TransactionType.BET | TransactionType.MARKET_SEED;
    description!: string;
}