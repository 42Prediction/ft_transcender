import { TransactionType } from "../entities/transaction.entity";

export class CreditWalletDto{
    amount!: number;
    type!:TransactionType.DEPOSIT | TransactionType.PAYOUT | TransactionType.COMMISSION | TransactionType.SCHOOL42_REWARD | TransactionType.ENGAGEMENT_REWARD;
    description!: string;
}