import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Bettor } from './entities/bettor.entity';
import { BettorQuest } from './entities/bettor-quest.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';

const QUESTS: { key: string; title: string; description: string; reward: number }[] = [
  { key: 'first_bet', title: 'Place your first bet', description: 'Back a prediction on any market.', reward: 100 },
  { key: 'add_friend', title: 'Make your first friend', description: 'Get a friend request accepted.', reward: 50 },
  { key: 'first_win', title: 'Win your first bet', description: 'Have a bet resolve in your favour.', reward: 150 },
];


@Injectable()
export class EngagementService {

  private static readonly DAILY_BASE = 50;
  private static readonly DAILY_STEP = 10;
  private static readonly DAILY_MAX_BONUS_DAYS = 7;
  private static readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepo: Repository<Bettor>,
    @InjectRepository(BettorQuest)
    private readonly questRepo: Repository<BettorQuest>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  private utcDay(date: Date): number {
    return Math.floor(date.getTime() / EngagementService.MS_PER_DAY);
  }

  private rewardFor(streak: number): number {
    const bonusDays = Math.min(streak - 1, EngagementService.DAILY_MAX_BONUS_DAYS);
    return EngagementService.DAILY_BASE + bonusDays * EngagementService.DAILY_STEP;
  }

  private nextStreak(lastDay: number | null, todayDay: number, currentStreak: number): number {
    if (lastDay !== null && todayDay - lastDay === 1) return currentStreak + 1;
    return 1;
  }

  private async getBettor(userId: string): Promise<Bettor> {
    const bettor = await this.bettorRepo.findOne({ where: { user: { id: userId } } });
    if (!bettor) throw new NotFoundException('Bettor not found');
    return bettor;
  }

  async getDailyStatus(userId: string) {
    const bettor = await this.getBettor(userId);
    const todayDay = this.utcDay(new Date());
    const lastDay = bettor.lastDailyClaimAt ? this.utcDay(bettor.lastDailyClaimAt) : null;
    const claimedToday = lastDay !== null && lastDay === todayDay;
    const previewStreak = this.nextStreak(lastDay, todayDay, bettor.dailyStreak);
    return {
      canClaim: !claimedToday,
      streak: bettor.dailyStreak,
      nextReward: claimedToday ? null : this.rewardFor(previewStreak),
      nextStreak: claimedToday ? bettor.dailyStreak : previewStreak,
    };
  }

  async claimDaily(userId: string) {
    const bettor = await this.getBettor(userId);
    const now = new Date();
    const todayDay = this.utcDay(now);
    const lastDay = bettor.lastDailyClaimAt ? this.utcDay(bettor.lastDailyClaimAt) : null;

    if (lastDay !== null && lastDay === todayDay) {
      throw new BadRequestException('Daily bonus already claimed today');
    }

    const streak = this.nextStreak(lastDay, todayDay, bettor.dailyStreak);
    const reward = this.rewardFor(streak);

    await this.dataSource.transaction(async (manager) => {
      await this.walletService.credit(
        bettor.id,
        {
          amount: reward,
          type: TransactionType.ENGAGEMENT_REWARD,
          description: `Daily bonus (day ${streak})`,
        },
        manager,
      );
      await manager.update(Bettor, bettor.id, { dailyStreak: streak, lastDailyClaimAt: now });
    });

    return { claimed: true, reward, streak };
  }

  private async isMet(key: string, bettorId: string): Promise<boolean> {
    let sql: string;
    switch (key) {
      case 'first_bet':
        sql = `SELECT EXISTS(SELECT 1 FROM market_positions WHERE bettor_id=$1) AS e`;
        break;
      case 'add_friend':
        sql = `SELECT EXISTS(SELECT 1 FROM bettor_friends WHERE bettor_id=$1) AS e`;
        break;
      case 'first_win':
        sql = `SELECT EXISTS(SELECT 1 FROM market_positions WHERE bettor_id=$1 AND payout IS NOT NULL AND payout > amount) AS e`;
        break;
      default:
        return false;
    }
    const rows = await this.dataSource.query(sql, [bettorId]);
    return rows[0]?.e === true;
  }

  async listQuests(userId: string) {
    const bettor = await this.getBettor(userId);
    const done = await this.questRepo.find({ where: { bettorId: bettor.id } });
    const claimedKeys = new Set(done.map((q) => q.questKey));

    const quests = await Promise.all(
      QUESTS.map(async (q) => {
        const claimed = claimedKeys.has(q.key);
        const met = claimed ? true : await this.isMet(q.key, bettor.id);
        return { key: q.key, title: q.title, description: q.description, reward: q.reward, met, claimed };
      }),
    );
    const claimableTotal = quests
      .filter((q) => q.met && !q.claimed)
      .reduce((s, q) => s + q.reward, 0);
    return { quests, claimableTotal };
  }

  async claimQuests(userId: string) {
    const bettor = await this.getBettor(userId);
    const done = await this.questRepo.find({ where: { bettorId: bettor.id } });
    const claimedKeys = new Set(done.map((q) => q.questKey));

    const newlyClaimed: { key: string; title: string; reward: number }[] = [];
    for (const q of QUESTS) {
      if (claimedKeys.has(q.key)) continue;
      if (!(await this.isMet(q.key, bettor.id))) continue;
      try {
        await this.dataSource.transaction(async (manager) => {
          await manager.insert(BettorQuest, {
            bettorId: bettor.id,
            questKey: q.key,
            reward: q.reward,
          });
          await this.walletService.credit(
            bettor.id,
            {
              amount: q.reward,
              type: TransactionType.ENGAGEMENT_REWARD,
              description: `Quest: ${q.title}`,
            },
            manager,
          );
        });
        newlyClaimed.push({ key: q.key, title: q.title, reward: q.reward });
      } catch {
      }
    }
    return { claimed: newlyClaimed, total: newlyClaimed.reduce((s, q) => s + q.reward, 0) };
  }
}
