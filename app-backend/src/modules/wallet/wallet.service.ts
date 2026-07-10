import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Wallet } from "./entities/wallet.entity";
import { Repository, DataSource, EntityManager } from "typeorm";
import { Transaction, TransactionStatus, TransactionType } from "./entities/transaction.entity";
import { WalletResponseDto } from "./dto/wallet-response.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";
import { CreditWalletDto } from "./dto/credit.dto";
import { DebitWalletDto } from "./dto/debit.dto";

const INITIAL_BALANCE = 1000;
// The single admin acts as the house: it funds every market's seed liquidity
// and collects the rake. It therefore starts with a large treasury rather than
// the regular new-user bonus.
export const ADMIN_TREASURY_BALANCE = 1_000_000;

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
        private readonly dataSource: DataSource
    ) { }

    async createWallet(
        idBettor: string,
        initialBalance: number = INITIAL_BALANCE,
        description = 'New user bonus',
    ): Promise<WalletResponseDto> {
        const existing = await this.walletRepository.findOne({ where: { idBettor } });
        if (existing)
            throw new ConflictException(`Wallet already exists for user ${idBettor}`);
        return this.dataSource.transaction(async (manager) => {
            const wallet = manager.create(Wallet, {
                idBettor,
                balance: initialBalance,
            });
            const savedWallet = await manager.save(Wallet, wallet);

            const transaction = manager.create(Transaction, {
                idWallet: savedWallet.id,
                amount: initialBalance,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.COMPLETED,
                balanceBefore: 0,
                balanceAfter: initialBalance,
                description,

            });

            await manager.save(Transaction, transaction);

            this.logger.log(`Wallet created for user ${idBettor} with initial balance of ${initialBalance}`);
            return this.toWalletDto(savedWallet);
        });
    }

    async getMyWallet(idBettor: string): Promise<WalletResponseDto> {
        const wallet = await this.walletRepository.findOne({ where: { idBettor } });
        if (!wallet)
            throw new NotFoundException(`Wallet not found for ${idBettor}`);
        return this.toWalletDto(wallet);

    }

    async getMyTransactions(idBettor: string): Promise<TransactionResponseDto[]> {
        const wallet = await this.walletRepository.findOne({ where: { idBettor } });
        if (!wallet)
            throw new NotFoundException(`Wallet not found for ${idBettor}`);
        const transactions = await this.transactionRepository.find({
            where: { idWallet: wallet.id },
            order: { createdAt: 'DESC' }
        });
        return transactions.map(this.toTransactionDto);
    }

    /**
     * Credits a wallet. Pass `externalManager` to run inside a caller-owned
     * transaction (so the credit and the caller's own writes commit atomically);
     * omit it to run in its own transaction.
     */
    async credit(
        idBettor: string,
        dto: CreditWalletDto,
        externalManager?: EntityManager,
    ): Promise<TransactionResponseDto> {
        if (dto.amount <= 0)
            throw new BadRequestException('The credit amount must be positive');
        const run = async (manager: EntityManager) => {
            const wallet = await manager
                .createQueryBuilder(Wallet, 'wallet')
                .setLock('pessimistic_write')
                .where('wallet.idBettor = :idBettor', { idBettor })
                .getOne();

            if (!wallet)
                throw new NotFoundException(`Wallet not found for ${idBettor}`);
            const balanceBefore = Number(wallet.balance);
            const balanceAfter = balanceBefore + dto.amount;
            wallet.balance = balanceAfter;
            await manager.save(Wallet, wallet);

            const transaction = manager.create(Transaction, {
                idWallet: wallet.id,
                amount: dto.amount,
                type: dto.type,
                status: TransactionStatus.COMPLETED,
                balanceBefore,
                balanceAfter,
                description: dto.description
            });

            const saved = await manager.save(Transaction, transaction);
            this.logger.log(`Credit of ${dto.amount} applied to user ${idBettor}. New balance: ${balanceAfter}`);
            return this.toTransactionDto(saved);
        };
        return externalManager ? run(externalManager) : this.dataSource.transaction(run);
    }

    async debit(idBettor: string, dto: DebitWalletDto): Promise<TransactionResponseDto> {
        if (dto.amount <= 0)
            throw new BadRequestException('The debit amount must be positive');
        return this.dataSource.transaction(async (manager) => {
            const wallet = await manager
                .createQueryBuilder(Wallet, 'wallet')
                .setLock('pessimistic_write')
                .where('wallet.idBettor = :idBettor', { idBettor })
                .getOne();

            if (!wallet)
                throw new NotFoundException(`Wallet not found for ${idBettor}`);
            const balanceBefore = Number(wallet.balance);

            if (balanceBefore < dto.amount)
                throw new BadRequestException(`Insufficient balance. Current balance: ${balanceBefore}, requested amount: ${dto.amount}`);
            const balanceAfter = balanceBefore - dto.amount;
            wallet.balance = balanceAfter;
            await manager.save(Wallet, wallet);

            const transaction = manager.create(Transaction, {
                idWallet: wallet.id,
                amount: dto.amount,
                type: dto.type,
                status: TransactionStatus.COMPLETED,
                balanceBefore,
                balanceAfter,
                description: dto.description
            });

            const saved = await manager.save(Transaction, transaction);
            this.logger.log(`Debit of ${dto.amount} applied to user ${idBettor}. New balance: ${balanceAfter}`);
            return this.toTransactionDto(saved);
        });
    }

    private toWalletDto(wallet: Wallet): WalletResponseDto {
        return {
            id: wallet.id,
            idBettor: wallet.idBettor,
            balance: Number(wallet.balance)
        };
    }

    private toTransactionDto(transaction: Transaction): TransactionResponseDto {
        return {
            id: transaction.id,
            idWallet: transaction.idWallet,
            amount: Number(transaction.amount),
            type: transaction.type,
            status: transaction.status,
            balanceBefore: Number(transaction.balanceBefore),
            balanceAfter: Number(transaction.balanceAfter),
            description: transaction.description
        };
    }
}