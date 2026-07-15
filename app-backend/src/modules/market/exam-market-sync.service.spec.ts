import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamMarketSyncService } from './exam-market-sync.service';
import { Market, MarketResolution, MarketStatus } from './entities/market.entity';
import { Bettor } from '../bettor/entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { School42Service, type Exam42 } from '../school42/school42.service';
import { MarketGateway } from './market.gateway';
import { MarketService } from './market.service';

const PAST = new Date('2026-01-01T10:00:00Z').toISOString();
const FUTURE = new Date('2999-01-01T10:00:00Z').toISOString();

function exam(overrides: Partial<Exam42> = {}): Exam42 {
  return {
    id: 1,
    name: 'Exam Rank 02',
    projectId: 42,
    beginAt: PAST,
    endAt: PAST,
    ...overrides,
  } as Exam42;
}

function rosterEntry(login: string, finalMark: number | null, status: string) {
  return { login, name: login, avatar: null, finalMark, status };
}

function pendingMarket(login: string): Market {
  return {
    id: `m-${login}`,
    examId: '1',
    subjectLogin: login,
    status: MarketStatus.CLOSING,
  } as unknown as Market;
}

describe('ExamMarketSyncService.autoResolveExamMarkets', () => {
  let service: ExamMarketSyncService;
  let marketRepo: { find: jest.Mock };
  let school42: { getExam: jest.Mock; getExamRoster: jest.Mock };
  let marketService: { resolveMarket: jest.Mock };

  beforeEach(async () => {
    process.env.SEED_MODE = 'true';

    marketRepo = { find: jest.fn() };
    school42 = { getExam: jest.fn(), getExamRoster: jest.fn() };
    marketService = { resolveMarket: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        ExamMarketSyncService,
        { provide: getRepositoryToken(Market), useValue: marketRepo },
        { provide: getRepositoryToken(Bettor), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: WalletService, useValue: {} },
        { provide: School42Service, useValue: school42 },
        { provide: MarketGateway, useValue: {} },
        { provide: MarketService, useValue: marketService },
      ],
    }).compile();

    service = module.get(ExamMarketSyncService);
  });

  afterEach(() => {
    delete process.env.SEED_MODE;
  });

  it('resolves every market once the exam ends — 100 is YES, anything else (even ungraded) is NO', async () => {
    marketRepo.find.mockResolvedValue([
      pendingMarket('fmacau'),
      pendingMarket('alice'),
      pendingMarket('bob'),
    ]);
    school42.getExam.mockResolvedValue(exam());
    school42.getExamRoster.mockResolvedValue([
      rosterEntry('fmacau', 0, 'in_progress'),
      rosterEntry('alice', 100, 'finished'),
      rosterEntry('bob', null, 'in_progress'),
    ]);

    await service.autoResolveExamMarkets();

    expect(marketService.resolveMarket).toHaveBeenCalledWith('m-fmacau', MarketResolution.NO, 0);
    expect(marketService.resolveMarket).toHaveBeenCalledWith('m-alice', MarketResolution.YES, 100);
    expect(marketService.resolveMarket).toHaveBeenCalledWith('m-bob', MarketResolution.NO, undefined);
    expect(marketService.resolveMarket).toHaveBeenCalledTimes(3);
  });

  it('leaves markets untouched while the exam window is still open', async () => {
    marketRepo.find.mockResolvedValue([pendingMarket('fmacau')]);
    school42.getExam.mockResolvedValue(exam({ endAt: FUTURE }));

    await service.autoResolveExamMarkets();

    expect(school42.getExamRoster).not.toHaveBeenCalled();
    expect(marketService.resolveMarket).not.toHaveBeenCalled();
  });
});
