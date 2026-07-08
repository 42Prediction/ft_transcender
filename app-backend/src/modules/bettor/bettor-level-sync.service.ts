import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Bettor } from './entities/bettor.entity';
import { LEVEL_TO_ANDA_RATE } from './bettor.service';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';
import { School42Service } from '../school42/school42.service';

/**
 * Phase 2 of the "42 level → ₳" economy: a daily job that re-reads each cadet's
 * current 42 level and credits the gain since we last saw it (`Δlevel × rate`).
 * Level is monotonic, so we only ever pay increases — no anti-farming guard and
 * no need to handle decreases. The credit and the snapshot update commit in one
 * transaction, so a crash can neither double-pay nor lose a level-up.
 */
@Injectable()
export class BettorLevelSyncService {
  private readonly logger = new Logger(BettorLevelSyncService.name);

  constructor(
    @InjectRepository(Bettor)
    private readonly bettorRepo: Repository<Bettor>,
    private readonly walletService: WalletService,
    private readonly school42Service: School42Service,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async syncLevels(): Promise<void> {
    const cadets = await this.bettorRepo.find({
      where: { school42Login: Not(IsNull()) },
    });
    if (cadets.length === 0) return;

    this.logger.log(`Level sync: checking ${cadets.length} 42 cadet(s)`);
    let credited = 0;

    for (const cadet of cadets) {
      try {
        const student = await this.school42Service.getStudent(cadet.school42Login!);
        if (!student) continue;

        const newLevel = student.level;
        const oldLevel = Number(cadet.school42Level ?? 0);
        // Only pay real gains; 42 levels never drop, so a lower/equal reading is
        // a transient API hiccup or no progress — skip without touching anything.
        if (!(newLevel > oldLevel)) continue;

        const reward = Number(((newLevel - oldLevel) * LEVEL_TO_ANDA_RATE).toFixed(2));
        if (reward <= 0) continue;

        await this.dataSource.transaction(async (manager) => {
          await this.walletService.credit(
            cadet.id,
            {
              amount: reward,
              type: TransactionType.SCHOOL42_REWARD,
              description: `42 level up ${oldLevel} → ${newLevel}`,
            },
            manager,
          );
          await manager.update(Bettor, cadet.id, { school42Level: newLevel });
        });
        credited++;
      } catch (err) {
        this.logger.warn(`Level sync failed for ${cadet.school42Login}: ${err}`);
      }
    }

    this.logger.log(`Level sync done: ${credited} cadet(s) credited`);
  }
}
