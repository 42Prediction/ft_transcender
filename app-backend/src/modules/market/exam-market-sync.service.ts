import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { Market, MarketCategory, MarketResolution, MarketStatus } from './entities/market.entity';
import { Bettor } from '../bettor/entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../../shared/enums/roles.enum';
import { WalletService } from '../wallet/wallet.service';
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

/**
 * The platform's whole scope is Exam Rank 02-06 — anything else (Rank 01,
 * non-rank exams/events) is deliberately out of scope and must not produce a
 * market. Returns `null` for anything outside that.
 */
function mapExamNameToCategory(examName: string): MarketCategory | null {
  const match = examName.match(/rank\s*0*(\d+)/i);
  if (!match) return null;
  const rank = match[1].padStart(2, '0');
  return EXAM_CATEGORY_BY_RANK[rank] ?? null;
}

/**
 * Markets are no longer created by hand: this service sources them straight
 * from the 42 School API. Every cadet registered for an upcoming exam at the
 * campus gets a YES/NO market — "will they score 100 on this exam?" — and
 * markets auto-resolve once 42 publishes the grade.
 */
@Injectable()
export class ExamMarketSyncService {
  private readonly logger = new Logger(ExamMarketSyncService.name);
  private systemBettorId: string | null = null;

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

  /**
   * Runs for every upcoming exam at the campus (not just a specific project —
   * whatever `/campus/:id/exams` returns), covering both directions of
   * market membership up until the exam ends:
   *  - new registrants get a market opened for them;
   *  - cadets who deregister get their market cancelled and refunded.
   */
  @Cron('0 */15 * * * *')
  async syncExamMarkets() {
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

        // `projects_users?filter[campus]=X` matches where the attempt took
        // place, not the cadet's home campus — network-wide staff/QA test
        // accounts hold a record at nearly every campus and slip through
        // that filter. Verify each in_progress candidate's actual primary
        // campus before it's allowed to get a market.
        const candidates = roster.filter((c) => c.status === 'in_progress' && c.finalMark !== 100);
        const invalidCampusLogins = new Set<string>();
        const eligible: typeof candidates = [];
        for (const cadet of candidates) {
          const isLuandaStudent = await this.school42Service.isPrimaryCampusStudent(cadet.login);
          if (isLuandaStudent === true) {
            eligible.push(cadet);
          } else if (isLuandaStudent === false) {
            invalidCampusLogins.add(cadet.login);
          }
          // null (couldn't verify) — skip this cycle entirely, retry next run.
        }

        for (const cadet of eligible) {
          const existing = await this.marketRepo.findOne({
            where: { examId: String(exam.id), subjectLogin: cadet.login },
          });

          // A cadet who re-registers after a deregistration finds their old
          // (unique-indexed) market row still there, just CANCELLED — revive
          // it with a clean pool rather than skip creating a fresh one.
          if (existing && existing.status !== MarketStatus.CANCELLED) continue;

          const creatorId = await this.getOrCreateSystemBettorId();
          if (!creatorId) continue;

          const closesAt = new Date(exam.beginAt);
          const status = this.marketService.computeStatus(closesAt, new Date());

          let market: Market;
          if (existing) {
            existing.yesPool = 100;
            existing.noPool = 100;
            existing.closesAt = closesAt;
            existing.resolvedAt = undefined;
            existing.resolution = undefined;
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
  }

  /**
   * Cancels (with refund) any active market whose cadet either:
   *  - has no `projects_users` record for the exam at all anymore
   *    (deregistered) — status other than `in_progress` alone doesn't count,
   *    that also matches cadets who simply finished and should be resolved,
   *    not voided; or
   *  - failed the primary-campus check (not actually a 42 Luanda cadet).
   * Only applies before the exam ends; once it's over, `autoResolveExamMarkets`
   * owns the outcome for anyone still legitimately in the roster.
   */
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
    const pending = await this.marketRepo.find({
      where: {
        examId: Not(IsNull()),
        status: Not(In([MarketStatus.RESOLVED, MarketStatus.CANCELLED])),
        closesAt: LessThanOrEqual(new Date()),
      },
    });
    if (pending.length === 0) return;

    const examIds = [...new Set(pending.map((m) => m.examId!))];

    for (const examId of examIds) {
      try {
        const exam = await this.school42Service.getExam(Number(examId));
        if (!exam) continue;

        const cadets = await this.school42Service.getExamGrades(exam);
        const gradedByLogin = new Map(
          cadets.filter((c) => c.finalMark != null).map((c) => [c.login, c.finalMark!]),
        );

        const marketsForExam = pending.filter((m) => m.examId === examId);
        for (const market of marketsForExam) {
          const finalMark = gradedByLogin.get(market.subjectLogin);
          if (finalMark == null) continue;

          const resolution = finalMark >= 100 ? MarketResolution.YES : MarketResolution.NO;
          await this.marketService.resolveMarket(market.id, resolution);
        }
      } catch (err) {
        this.logger.warn(`autoResolveExamMarkets failed for exam ${examId}: ${err}`);
      }
    }
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
