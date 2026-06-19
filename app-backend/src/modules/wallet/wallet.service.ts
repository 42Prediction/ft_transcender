import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Wallet } from "./entities/wallet.entity";
import { Repository, DataSource } from "typeorm";
import { Transaction, TransactionStatus, TransactionType } from "./entities/transaction.entity";
import { WalletResponseDto } from "./dto/wallet-response.dto";

const INITIAL_BALANCE = 1000;

@Injectable()
export class WalletService{
    private readonly logger = new Logger(WalletService.name);

    constructor(
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
        private readonly dataSource: DataSource
    ){}

    async createWallet(idBettor: string): Promise<WalletResponseDto>{
        const existing = await this.walletRepository.findOne({where: {idBettor}});
        if (existing)
            throw new ConflictException(`Wallet already exists for user ${idBettor}`);
        return this.dataSource.transaction(async (manager) => {
            const wallet = manager.create(Wallet, {
                idBettor,
                balance: INITIAL_BALANCE,
            });
            const savedWallet = await manager.save(Wallet, wallet);

            const transaction = manager.create(Transaction, {
                idWallet: savedWallet.id,
                amount: INITIAL_BALANCE,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.COMPLETED,
                balanceBefore: 0,
                balanceAfter: INITIAL_BALANCE,
                description: 'Bonus de boas-vindas'

            });

            await manager.save(Transaction, transaction);

            this.logger.log(`Wallet criada para o utilizador ${idBettor} com saldo inicial de ${INITIAL_BALANCE}`);
            return this.toWalletDto(savedWallet);
        });
    }

    async getMyWallet(idBettor: string): Promise<WalletResponseDto>{
        const wallet = await this.walletRepository.findOne({where: {idBettor}});
        if(!wallet)
            throw new NotFoundException('wallet não encontrada para este utilizador');
        return this.toWalletDto(wallet);

    }

    private toWalletDto(savedWallet: Wallet): WalletResponseDto {
        return {
            id: savedWallet.id,
            idBettor: savedWallet.idBettor,
            balance: Number(savedWallet.balance) 
        };
    }
}