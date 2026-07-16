import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Market, MarketCategory, MarketResolution, MarketStatus } from './entities/market.entity';
import { Bettor } from '../bettor/entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../../shared/enums/roles.enum';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';
import { Exam42, School42Service } from '../school42/school42.service';
import { MarketGateway } from './market.gateway';
import { MarketService } from './market.service';
import { createAvatar } from '@dicebear/core';
import { avataaarsNeutral } from '@dicebear/collection';

const EXAM_CATEGORY_BY_RANK: Record<string, MarketCategory> = {
  '02': MarketCategory.EXAM_02,
  '03': MarketCategory.EXAM_03,
  '04': MarketCategory.EXAM_04,
  '05': MarketCategory.EXAM_05,
  '06': MarketCategory.EXAM_06,
};

function mapExamNameToCategory(examName: string): MarketCategory | null {
  const match = examName.match(/rank\s*0*(\d+)/i);
  if (!match) return null;
  const rank = match[1].padStart(2, '0');
  return EXAM_CATEGORY_BY_RANK[rank] ?? null;
}

@Injectable()
export class ExamMarketSyncService implements OnModuleInit {
  private readonly logger = new Logger(ExamMarketSyncService.name);
  private systemBettorId: string | null = null;

  private static readonly AUTO_MARKET_SEED = 200;

  constructor(
    @InjectRepository(Market)
    private readonly marketRepo: Repository<Market>,
    @InjectRepository(Bettor)
    private readonly bettorRepo: Repository<Bettor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly walletService: WalletService,
    private readonly school42Service: School42Service,
    private readonly marketGateway: MarketGateway,
    private readonly marketService: MarketService,
  ) {}


  onModuleInit() {

    if (process.env.SEED_MODE === 'true') return;
    setTimeout(() => {
      void this.syncExamMarkets().catch((err) =>
        this.logger.error(`initial syncExamMarkets on startup failed: ${err}`),
      );
    }, 5000);
  }


  @Cron('0 */15 * * * *')
  async syncExamMarkets() {
    const startedAt = Date.now();
    const exams = await this.school42Service.getUpcomingExams(14);
    if (exams.length === 0) return;

    for (const exam of exams) {
      try {
        const category = mapExamNameToCategory(exam.name);
        if (!category) {
          this.logger.debug(`syncExamMarkets: "${exam.name}" is outside the Exam 02-06 scope, skipping`);
          continue;
        }

        const roster = await this.school42Service.getExamRoster(exam);
        const rosterLogins = new Set(roster.map((c) => c.login));

        const candidates = roster.filter((c) => c.status === 'in_progress');


        let validCampus: Set<string> | null = null;
        try {
          validCampus = await this.school42Service.filterToPrimaryCampus(
            candidates.map((c) => c.login),
          );

          if (validCampus.size === 0 && candidates.length > 0) {
            this.logger.warn(
              `syncExamMarkets: campus verify matched 0 of ${candidates.length} candidates for exam ${exam.id}, skipping this cycle`,
            );
            validCampus = null;
          }
        } catch (err) {
          this.logger.warn(`syncExamMarkets: campus verify failed for exam ${exam.id}: ${err}`);
        }

        const invalidCampusLogins = new Set<string>();
        const eligible: typeof candidates = [];
        if (validCampus) {
          for (const cadet of candidates) {
            if (validCampus.has(cadet.login)) {
              eligible.push(cadet);
            } else {
              invalidCampusLogins.add(cadet.login);
            }
          }
        }

        const existingMarkets = eligible.length
          ? await this.marketRepo.find({
              where: { examId: String(exam.id), subjectLogin: In(eligible.map((c) => c.login)) },
            })
          : [];
        const existingByLogin = new Map(existingMarkets.map((m) => [m.subjectLogin, m]));


        const examEndsAt = new Date(exam.endAt);
        const staleEndsAt = existingMarkets.filter(
          (m) =>
            m.status !== MarketStatus.CANCELLED &&
            m.examEndsAt?.getTime() !== examEndsAt.getTime(),
        );
        if (staleEndsAt.length > 0) {
          await this.marketRepo.update(
            { id: In(staleEndsAt.map((m) => m.id)) },
            { examEndsAt },
          );
        }

        for (const cadet of eligible) {
          const existing = existingByLogin.get(cadet.login);

          if (existing && existing.status !== MarketStatus.CANCELLED) continue;

          const creatorId = await this.getOrCreateSystemBettorId();
          if (!creatorId) continue;

          try {
            await this.walletService.debit(creatorId, {
              amount: ExamMarketSyncService.AUTO_MARKET_SEED,
              type: TransactionType.MARKET_SEED,
              description: `Auto exam market seed: ${exam.name} — ${cadet.login}`,
            });
          } catch (err) {
            this.logger.warn(
              `syncExamMarkets: skipping ${cadet.login} (${exam.name}), admin seed debit failed: ${err}`,
            );
            continue;
          }

          const closesAt = new Date(exam.beginAt);
          const status = this.marketService.computeStatus(closesAt, new Date());

          let market: Market;
          if (existing) {
            existing.yesPool = 100;
            existing.noPool = 100;
            existing.closesAt = closesAt;
            existing.examEndsAt = examEndsAt;
            existing.resolvedAt = undefined;
            existing.resolution = undefined;
            existing.finalGrade = undefined;
            existing.subjectName = cadet.name;
            existing.subjectAvatar = cadet.avatar ?? undefined;
            existing.status = status;
            existing.category = category;
            market = existing;
          } else {
            market = this.marketRepo.create({
              examId: String(exam.id),
              subjectLogin: cadet.login,
              subjectName: cadet.name,
              subjectAvatar: cadet.avatar ?? undefined,
              project: exam.name,
              category,
              closesAt,
              examEndsAt,
              creatorId,
              status,
            });
          }

          const saved = await this.marketRepo.save(market);
          this.marketGateway.emitMarketUpdate(this.marketService.toDto(saved));
        }

        await this.cancelDeregisteredMarkets(exam, rosterLogins, invalidCampusLogins);
      } catch (err) {
        this.logger.warn(`syncExamMarkets failed for exam ${exam.id}: ${err}`);
      }
    }

    this.logger.log(`syncExamMarkets: processed ${exams.length} exam(s) in ${Date.now() - startedAt}ms`);
  }


  private async cancelDeregisteredMarkets(
    exam: Exam42,
    rosterLogins: Set<string>,
    invalidCampusLogins: Set<string>,
  ) {
    if (Date.now() >= new Date(exam.endAt).getTime()) return;

    const activeMarkets = await this.marketRepo.find({
      where: {
        examId: String(exam.id),
        status: In([MarketStatus.NEW, MarketStatus.LIVE, MarketStatus.CLOSING]),
      },
    });

    for (const market of activeMarkets) {
      if (invalidCampusLogins.has(market.subjectLogin)) {
        await this.marketService.cancelMarket(market.id, 'not a 42 Luanda cadet');
        continue;
      }
      if (!rosterLogins.has(market.subjectLogin)) {
        await this.marketService.cancelMarket(market.id, 'cadet deregistered from exam');
      }
    }
  }

 
  @Cron('0 */10 * * * *')
  async autoResolveExamMarkets() {
    const startedAt = Date.now();
    const pending = await this.marketRepo.find({
      where: {
        examId: Not(IsNull()),
        status: Not(In([MarketStatus.RESOLVED, MarketStatus.CANCELLED])),
      },
    });
    if (pending.length === 0) return;

    const examIds = [...new Set(pending.map((m) => m.examId!))];

    for (const examId of examIds) {
      try {
        const exam = await this.school42Service.getExam(Number(examId));
        if (!exam) continue;


        if (Date.now() < new Date(exam.endAt).getTime()) continue;


        const roster = await this.school42Service.getExamRoster(exam);
        const gradedByLogin = new Map(
          roster
            .filter((c) => c.finalMark != null)
            .map((c) => [c.login, c.finalMark!]),
        );

        const marketsForExam = pending.filter((m) => m.examId === examId);
        for (const market of marketsForExam) {
          const finalMark = gradedByLogin.get(market.subjectLogin);
          const resolution =
            finalMark != null && finalMark >= 100 ? MarketResolution.YES : MarketResolution.NO;
          await this.marketService.resolveMarket(market.id, resolution, finalMark);
        }
      } catch (err) {
        this.logger.warn(`autoResolveExamMarkets failed for exam ${examId}: ${err}`);
      }
    }

    this.logger.log(
      `autoResolveExamMarkets: processed ${examIds.length} exam(s), ${pending.length} pending market(s) in ${Date.now() - startedAt}ms`,
    );
  }

  private async getOrCreateSystemBettorId(): Promise<string | null> {
    if (this.systemBettorId) return this.systemBettorId;

    const admin = await this.userRepo.findOne({ where: { role: Role.ADMIN } });
    if (!admin) {
      this.logger.warn('No admin user found to own auto-generated exam markets');
      return null;
    }

    let bettor = await this.bettorRepo.findOne({ where: { user: { id: admin.id } } });
    if (!bettor) {
      const avatar = createAvatar(avataaarsNeutral, { seed: admin.email }).toDataUri();
      const prefix = admin.email.split('@')[0].substring(0, 20).replace(/[^a-zA-Z0-9_.]/g, '');
      bettor = await this.bettorRepo.save(
        this.bettorRepo.create({ nick: `${prefix}_system`, avatar, user: admin }),
      );
      await this.walletService.createWallet(bettor.id);
    }

    this.systemBettorId = bettor.id;
    return this.systemBettorId;
  }
}
