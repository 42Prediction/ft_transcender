
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionStatus, TransactionType } from './entities/transaction.entity';

const makeWallet = (overrides: Partial<Wallet> = {}): Wallet =>
({
    id: 'wallet-1',
    idBettor: 'user-1',
    balance: 1000,
    ...overrides,
} as Wallet);

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
({
    id: 'tx-1',
    idWallet: 'wallet-1',
    amount: 100,
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.COMPLETED,
    balanceBefore: 1000,
    balanceAfter: 1100,
    description: 'Test',
    createdAt: new Date(),
    ...overrides,
} as Transaction);


const mockWalletRepository = () => ({
    findOne: jest.fn(),
});

const mockTransactionRepository = () => ({
    find: jest.fn(),
});

const buildManagerMock = (walletResult?: Wallet) => ({
    create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
    save: jest.fn().mockImplementation((_entity, data) => Promise.resolve({ id: 'new-id', ...data })),
    createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(walletResult),
    }),
});

const mockDataSource = (managerMock: ReturnType<typeof buildManagerMock>) => ({
    transaction: jest.fn().mockImplementation((cb: (m: any) => Promise<any>) => cb(managerMock)),
});

describe('WalletService', () => {
    let service: WalletService;
    let walletRepo: ReturnType<typeof mockWalletRepository>;
    let transactionRepo: ReturnType<typeof mockTransactionRepository>;
    let dataSource: { transaction: jest.Mock };

    beforeEach(async () => {
        walletRepo = mockWalletRepository();
        transactionRepo = mockTransactionRepository();
        const defaultManager = buildManagerMock(makeWallet());
        dataSource = mockDataSource(defaultManager);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WalletService,
                { provide: getRepositoryToken(Wallet), useValue: walletRepo },
                { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<WalletService>(WalletService);
    });

    afterEach(() => jest.clearAllMocks());
    
    describe('createWallet', () => {
        it('should create a wallet with initial balance of 1000', async () => {
            walletRepo.findOne.mockResolvedValue(null);

            const savedWallet = makeWallet({ id: 'new-wallet' });
            const manager = {
                create: jest.fn().mockImplementation((_e, data) => data),
                save: jest.fn()
                    .mockResolvedValueOnce(savedWallet)
                    .mockResolvedValueOnce({}),
            };
            dataSource.transaction.mockImplementation((cb: any) => cb(manager));

            const result = await service.createWallet('user-1');

            expect(walletRepo.findOne).toHaveBeenCalledWith({ where: { idBettor: 'user-1' } });
            expect(result.balance).toBe(1000);
            expect(result.idBettor).toBe('user-1');
        });

        it('should create a DEPOSIT transaction on wallet creation', async () => {
            walletRepo.findOne.mockResolvedValue(null);

            const savedWallet = makeWallet({ id: 'new-wallet' });
            const manager = {
                create: jest.fn().mockImplementation((_e, data) => data),
                save: jest.fn()
                    .mockResolvedValueOnce(savedWallet)
                    .mockResolvedValueOnce({}),
            };
            dataSource.transaction.mockImplementation((cb: any) => cb(manager));

            await service.createWallet('user-1');

            const txData = manager.create.mock.calls[1][1];
            expect(txData.type).toBe(TransactionType.DEPOSIT);
            expect(txData.amount).toBe(1000);
            expect(txData.balanceBefore).toBe(0);
            expect(txData.balanceAfter).toBe(1000);
        });

        it('should throw ConflictException when wallet already exists', async () => {
            walletRepo.findOne.mockResolvedValue(makeWallet());

            await expect(service.createWallet('user-1')).rejects.toThrow(ConflictException);
        });
    });

    describe('getMyWallet', () => {
        it('should return the wallet DTO for an existing user', async () => {
            walletRepo.findOne.mockResolvedValue(makeWallet({ balance: 500 }));

            const result = await service.getMyWallet('user-1');

            expect(result.idBettor).toBe('user-1');
            expect(result.balance).toBe(500);
        });

        it('should throw NotFoundException when wallet does not exist', async () => {
            walletRepo.findOne.mockResolvedValue(null);

            await expect(service.getMyWallet('unknown')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getMyTransactions', () => {
        it('should return all transactions for a user ordered by date DESC', async () => {
            walletRepo.findOne.mockResolvedValue(makeWallet());
            const txList = [makeTransaction(), makeTransaction({ id: 'tx-2', amount: 200 })];
            transactionRepo.find.mockResolvedValue(txList);

            const result = await service.getMyTransactions('user-1');

            expect(result).toHaveLength(2);
            expect(transactionRepo.find).toHaveBeenCalledWith({
                where: { idWallet: 'wallet-1' },
                order: { createdAt: 'DESC' },
            });
        });

        it('should throw NotFoundException when wallet does not exist', async () => {
            walletRepo.findOne.mockResolvedValue(null);

            await expect(service.getMyTransactions('unknown')).rejects.toThrow(NotFoundException);
        });

        it('should return an empty array when there are no transactions', async () => {
            walletRepo.findOne.mockResolvedValue(makeWallet());
            transactionRepo.find.mockResolvedValue([]);

            const result = await service.getMyTransactions('user-1');

            expect(result).toEqual([]);
        });
    });

    describe('credit', () => {
        it('should credit the wallet and return a transaction DTO', async () => {
            const wallet = makeWallet({ balance: 1000 });
            const manager = buildManagerMock(wallet);
            const savedTx = makeTransaction({ balanceBefore: 1000, balanceAfter: 1200, amount: 200 });
            manager.save
                .mockResolvedValueOnce(wallet)
                .mockResolvedValueOnce(savedTx);

            dataSource.transaction.mockImplementation((cb: any) => cb(manager));

            const result = await service.credit('user-1', {
                amount: 200,
                type: TransactionType.DEPOSIT,
                description: 'Top-up',
            });

            expect(result.balanceAfter).toBe(1200);
            expect(result.amount).toBe(200);
        });

        it('should throw BadRequestException for amount <= 0', async () => {
            await expect(
                service.credit('user-1', { amount: 0, type: TransactionType.DEPOSIT, description: '' }),
            ).rejects.toThrow(BadRequestException);

            await expect(
                service.credit('user-1', { amount: -50, type: TransactionType.DEPOSIT, description: '' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException when wallet does not exist', async () => {
            const manager = buildManagerMock(undefined);
            dataSource.transaction.mockImplementation((cb: any) => cb(manager));

            await expect(
                service.credit('ghost', { amount: 100, type: TransactionType.DEPOSIT, description: '' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('debit', () => {
        it('should debit the wallet and return a transaction DTO', async () => {
            const wallet = makeWallet({ balance: 1000 });
            const manager = buildManagerMock(wallet);
            const savedTx = makeTransaction({ balanceBefore: 1000, balanceAfter: 700, amount: 300 });
            manager.save
                .mockResolvedValueOnce(wallet)
                .mockResolvedValueOnce(savedTx);
            dataSource.transaction.mockImplementation((cb: any) => cb(manager));

            const result = await service.debit('user-1', {
                amount: 300,
                type: TransactionType.BET,
                description: 'Bet placed',
            });

            expect(result.balanceAfter).toBe(700);
            expect(result.amount).toBe(300);
        });

        it('should throw BadRequestException for amount <= 0', async () => {
            await expect(
                service.debit('user-1', { amount: 0, type: TransactionType.BET, description: '' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when balance is insufficient', async () => {
            const wallet = makeWallet({ balance: 50 });
            const manager = buildManagerMock(wallet);
            dataSource.transaction.mockImplementation((cb: any) => cb(manager));

            await expect(
                service.debit('user-1', { amount: 200, type: TransactionType.BET, description: '' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException when wallet does not exist', async () => {
            const manager = buildManagerMock(undefined);
            dataSource.transaction.mockImplementation((cb: any) => cb(manager));

            await expect(
                service.debit('ghost', { amount: 100, type: TransactionType.BET, description: '' }),
            ).rejects.toThrow(NotFoundException);
        });
    });
});