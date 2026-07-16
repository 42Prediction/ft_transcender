import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MarketService } from './market.service';
import { Market, MarketResolution, MarketStatus } from './entities/market.entity';
import { BetSide, MarketPosition } from './entities/market-position.entity';
import { Bettor } from '../bettor/entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';
import { MarketGateway } from './market.gateway';
import { NotificationService } from './notification.service';

const SEED_TOTAL = 200;

function makeMarket(overrides: Partial<Market> = {}): Market {
  return {
    id: 'm1',
    subjectName: 'Alice',
    subjectLogin: 'alice',
    subjectAvatar: null,
    category: 'Exam 02',
    project: 'Exam 02',
    closesAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2025-12-01T00:00:00Z'),
    status: MarketStatus.LIVE,
    yesPool: 100,
    noPool: 100,
    creatorId: 'admin',
    examId: null,
    examEndsAt: null,
    resolution: null,
    finalGrade: null,
    creator: null,
    ...overrides,
  } as unknown as Market;
}

function makePosition(overrides: Partial<MarketPosition> = {}): MarketPosition {
  return {
    id: 'p1',
    marketId: 'm1',
    bettorId: 'b1',
    side: BetSide.YES,
    amount: 100,
    shares: 100,
    entryPrice: 0.5,
    payout: null,
    ...overrides,
  } as unknown as MarketPosition;
}

describe('MarketService.resolveMarket — creator seed handling', () => {
  let service: MarketService;
  let marketRepo: { findOne: jest.Mock; save: jest.Mock };
  let positionRepo: { find: jest.Mock; save: jest.Mock };
  let bettorRepo: { findOne: jest.Mock };
  let walletService: { credit: jest.Mock };
  let notificationService: { createMany: jest.Mock };
  let gateway: { emitMarketUpdate: jest.Mock; emitMarketRemoved: jest.Mock };

  beforeEach(async () => {
    marketRepo = { findOne: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    positionRepo = { find: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    bettorRepo = { findOne: jest.fn() };
    walletService = { credit: jest.fn().mockResolvedValue(undefined) };
    notificationService = { createMany: jest.fn().mockResolvedValue(undefined) };
    gateway = { emitMarketUpdate: jest.fn(), emitMarketRemoved: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        MarketService,
        { provide: getRepositoryToken(Market), useValue: marketRepo },
        { provide: getRepositoryToken(MarketPosition), useValue: positionRepo },
        { provide: getRepositoryToken(Bettor), useValue: bettorRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: WalletService, useValue: walletService },
        { provide: MarketGateway, useValue: gateway },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get(MarketService);
  });

  function creatorCredits() {
    return walletService.credit.mock.calls.filter(([bettorId]) => bettorId === 'admin');
  }

  it('refunds the admin seed to the creator when nobody bet', async () => {
    marketRepo.findOne.mockResolvedValue(makeMarket());
    positionRepo.find.mockResolvedValue([]);

    const result = await service.resolveMarket('m1', MarketResolution.YES);

    expect(walletService.credit).toHaveBeenCalledTimes(1);
    expect(walletService.credit).toHaveBeenCalledWith(
      'admin',
      expect.objectContaining({
        amount: SEED_TOTAL,
        type: TransactionType.COMMISSION,
        description: expect.stringContaining('Seed refund'),
      }),
    );
    expect(result).toMatchObject({ resolved: true, winnersCount: 0, totalPool: SEED_TOTAL });
  });

  it('returns the full pool to the creator when every bet was on the losing side', async () => {
    const market = makeMarket({ noPool: 150 });
    marketRepo.findOne.mockResolvedValue(market);
    positionRepo.find.mockResolvedValue([
      makePosition({ id: 'p-no', bettorId: 'loser', side: BetSide.NO, amount: 50, shares: 50 }),
    ]);

    await service.resolveMarket('m1', MarketResolution.YES);

    expect(walletService.credit).toHaveBeenCalledTimes(1);
    expect(creatorCredits()).toEqual([
      ['admin', expect.objectContaining({ amount: 250, type: TransactionType.COMMISSION })],
    ]);
    expect(positionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-no', payout: 0 }));
  });

  it('pays winners and credits the creator only the rake when there is a winning side', async () => {
    const market = makeMarket({ yesPool: 200, noPool: 200 });
    marketRepo.findOne.mockResolvedValue(market);
    positionRepo.find.mockResolvedValue([
      makePosition({ id: 'p-yes', bettorId: 'winner', side: BetSide.YES, amount: 100, shares: 100 }),
      makePosition({ id: 'p-no', bettorId: 'loser', side: BetSide.NO, amount: 100, shares: 100 }),
    ]);

    await service.resolveMarket('m1', MarketResolution.YES);

    expect(walletService.credit).toHaveBeenCalledWith(
      'winner',
      expect.objectContaining({ amount: 395, type: TransactionType.PAYOUT }),
    );
    expect(creatorCredits()).toEqual([
      ['admin', expect.objectContaining({ amount: 5, type: TransactionType.COMMISSION })],
    ]);
    expect(walletService.credit).not.toHaveBeenCalledWith('loser', expect.anything());
  });

  describe('resolveMarketManually', () => {
    beforeEach(() => {
      jest.spyOn(service, 'resolveMarket').mockResolvedValue({ resolved: true } as any);
    });

    it('rejects exam-sourced markets outright — they only resolve automatically', async () => {
      marketRepo.findOne.mockResolvedValue(makeMarket({ examId: '30636' } as any));

      await expect(
        service.resolveMarketManually('m1', 'user-admin', MarketResolution.YES),
      ).rejects.toThrow(BadRequestException);
      expect(service.resolveMarket).not.toHaveBeenCalled();
    });

    it('rejects a requester who is not the market creator, even admin/moderator', async () => {
      marketRepo.findOne.mockResolvedValue(makeMarket());
      bettorRepo.findOne.mockResolvedValue({ id: 'someone-else' });

      await expect(
        service.resolveMarketManually('m1', 'user-mod', MarketResolution.YES),
      ).rejects.toThrow(ForbiddenException);
      expect(service.resolveMarket).not.toHaveBeenCalled();
    });

    it('lets the creator resolve their own manual market with YES/NO', async () => {
      marketRepo.findOne.mockResolvedValue(makeMarket());
      bettorRepo.findOne.mockResolvedValue({ id: 'admin' });

      await service.resolveMarketManually('m1', 'user-admin', MarketResolution.NO);

      expect(service.resolveMarket).toHaveBeenCalledWith('m1', MarketResolution.NO);
    });

    it('requires an explicit YES/NO resolution', async () => {
      marketRepo.findOne.mockResolvedValue(makeMarket());
      bettorRepo.findOne.mockResolvedValue({ id: 'admin' });

      await expect(service.resolveMarketManually('m1', 'user-admin')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.resolveMarket).not.toHaveBeenCalled();
    });
  });

  describe('computeStatus', () => {
    const HOUR = 60 * 60 * 1000;
    const now = new Date('2026-07-14T12:00:00Z');

    it('is CLOSED once the close time has passed (event under way, no verdict yet)', () => {
      const justClosed = new Date(now.getTime() - 1);
      expect(service.computeStatus(justClosed, now)).toBe(MarketStatus.CLOSED);
      const wellPast = new Date(now.getTime() - 5 * HOUR);
      expect(service.computeStatus(wellPast, now)).toBe(MarketStatus.CLOSED);
    });

    it('is CLOSED exactly at the close time', () => {
      expect(service.computeStatus(new Date(now), now)).toBe(MarketStatus.CLOSED);
    });

    it('is CLOSING within the last 24h before close, not CLOSED', () => {
      const soon = new Date(now.getTime() + 3 * HOUR);
      expect(service.computeStatus(soon, now)).toBe(MarketStatus.CLOSING);
    });

    it('is NEW when it closes far out and was created recently', () => {
      const farOut = new Date(now.getTime() + 72 * HOUR);
      const createdAt = new Date(now.getTime() - 2 * HOUR);
      expect(service.computeStatus(farOut, now, createdAt)).toBe(MarketStatus.NEW);
    });

    it('is LIVE when it closes far out and is older than 48h', () => {
      const farOut = new Date(now.getTime() + 72 * HOUR);
      const createdAt = new Date(now.getTime() - 72 * HOUR);
      expect(service.computeStatus(farOut, now, createdAt)).toBe(MarketStatus.LIVE);
    });
  });
});
