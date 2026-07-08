import { TransactionType } from "../entities/transaction.entity";

export class CreditWalletDto{
    amount!: number;
    type!:TransactionType.DEPOSIT | TransactionType.PAYOUT | TransactionType.COMMISSION;
    description!: string;
}