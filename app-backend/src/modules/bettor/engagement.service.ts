import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Bettor } from './entities/bettor.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';

/**
 * Phase 3 of the economy: universal engagement faucet. Currently the daily
 * streak bonus — a self-capped source (one claim per calendar day, reward
 * bounded by DAILY_MAX_BONUS_DAYS) that rewards showing up, not clicking.
 */
@Injectable()
export class EngagementService {
  // reward = BASE + min(streak-1, MAX_BONUS_DAYS) * STEP  → capped at 120/day.
  private static readonly DAILY_BASE = 50;
  private static readonly DAILY_STEP = 10;
  private static readonly DAILY_MAX_BONUS_DAYS = 7;
  private static readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepo: Repository<Bettor>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  /** Whole UTC calendar day for a timestamp, so same-day claims collide. */
  private utcDay(date: Date): number {
    return Math.floor(date.getTime() / EngagementService.MS_PER_DAY);
  }

  private rewardFor(streak: number): number {
    const bonusDays = Math.min(streak - 1, EngagementService.DAILY_MAX_BONUS_DAYS);
    return EngagementService.DAILY_BASE + bonusDays * EngagementService.DAILY_STEP;
  }

  /** The streak the next claim would land on, given the last claim day. */
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
      // What they'd earn if they claimed now (null once already claimed today).
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

    // Credit and streak update commit together, so a crash can neither double-pay
    // nor advance the streak without paying.
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
}
