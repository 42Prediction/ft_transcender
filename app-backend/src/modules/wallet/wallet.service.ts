import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Wallet } from "./entities/wallet.entity";
import { Repository, DataSource } from "typeorm";
import { Transaction, TransactionStatus, TransactionType } from "./entities/transaction.entity";
import { WalletResponseDto } from "./dto/wallet-response.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";
import { CreditWalletDto } from "./dto/credit.dto";
import { DebitWalletDto } from "./dto/debit.dto";

const INITIAL_BALANCE = 1000;

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
        private readonly dataSource: DataSource
    ) { }

    async createWallet(idBettor: string): Promise<WalletResponseDto> {
        const existing = await this.walletRepository.findOne({ where: { idBettor } });
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

    async getMyWallet(idBettor: string): Promise<WalletResponseDto> {
        const wallet = await this.walletRepository.findOne({ where: { idBettor } });
        if (!wallet)
            throw new NotFoundException('wallet não encontrada para este utilizador');
        return this.toWalletDto(wallet);

    }

    async getMyTransactions(idBettor: string): Promise<TransactionResponseDto[]> {
        const wallet = await this.walletRepository.findOne({ where: { idBettor } });
        if (!wallet)
            throw new NotFoundException('Wallet nao encontrada para este utilizador, reporta erro a equipa tecnica');
        const transactions = await this.transactionRepository.find({
            where: { idWallet: wallet.id },
            order: { createdAt: 'DESC' }
        });
        return transactions.map(this.toTransactionDto);
    }

    async credit(idBettor: string, dto: CreditWalletDto): Promise<TransactionResponseDto> {
        if (dto.amount <= 0)
            throw new BadRequestException('O montante do crédito deve ser positivo');
        return this.dataSource.transaction(async (manager) => {
            const wallet = await manager
                .createQueryBuilder(Wallet, 'wallet')
                .setLock('pessimistic_write')
                .where('wallet.idBettor = :idBettor', { idBettor })
                .getOne();

            if (!wallet)
                throw new NotFoundException('Wallet não encontrada');
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
            this.logger.log(`Crédito de ${dto.amount} para utilizador ${idBettor}. Novo saldo: ${balanceAfter}`);
            return this.toTransactionDto(saved);
        });
    }

    async debit(idBettor: string, dto: DebitWalletDto): Promise<TransactionResponseDto> {
        if (dto.amount <= 0)
            throw new BadRequestException('O montante do débito deve ser positivo');
        return this.dataSource.transaction(async (manager) => {
            const wallet = await manager
                .createQueryBuilder(Wallet, 'wallet')
                .setLock('pessimistic_write')
                .where('wallet.idBettor = :idBettor', { idBettor })
                .getOne();

            if (!wallet)
                throw new NotFoundException('Wallet não encontrada');
            const balanceBefore = Number(wallet.balance);

            if (balanceBefore < dto.amount)
                throw new BadRequestException(`Saldo insuficiente. Saldo atual: ${balanceBefore}, montante solicitado: ${dto.amount}`);
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
            this.logger.log(`Débito de ${dto.amount} para utilizador ${idBettor}. Novo saldo: ${balanceAfter}`);
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