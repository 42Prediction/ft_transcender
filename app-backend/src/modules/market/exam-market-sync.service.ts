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
export class ExamMarketSyncService implements OnModuleInit {
  private readonly logger = new Logger(ExamMarketSyncService.name);
  private systemBettorId: string | null = null;

  /**
   * xp the admin (house) funds per auto-generated exam market — the full 100/100
   * pool, matching what manual markets debit, so no currency is minted.
   */
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

  /**
   * `@Cron` only fires on its configured ticks — after a fresh deploy/restart
   * that leaves a gap of up to 15 minutes with no markets in the DB at all,
   * so the first users to log in see an empty list. Kick off one sync
   * shortly after the app boots, without blocking startup on it (42's API
   * can be slow; `syncExamMarkets` already contains its own failure
   * handling). The short delay gives TypeORM's connection time to settle
   * first — this hook can otherwise fire before the DB driver is ready.
   */
  onModuleInit() {
    // The seed script boots AppModule just to reach a couple of services; skip
    // the startup sync there — it would run against a DB that seeds tears down.
    if (process.env.SEED_MODE === 'true') return;
    setTimeout(() => {
      void this.syncExamMarkets().catch((err) =>
        this.logger.error(`initial syncExamMarkets on startup failed: ${err}`),
      );
    }, 5000);
  }

  /**
   * Runs for every upcoming exam at the campus (not just a specific project —
   * whatever `/campus/:id/exams` returns), covering both directions of
   * market membership up until the exam ends:
   *  - new registrants get a market opened for them;
   *  - cadets who deregister get their market cancelled and refunded.
   */
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

        // `projects_users?filter[campus]=X` matches where the attempt took
        // place, not the cadet's home campus — network-wide staff/QA test
        // accounts hold a record at nearly every campus and slip through
        // that filter. Verify each in_progress candidate against the actual
        // primary-campus membership list before it's allowed to get a market.
        const candidates = roster.filter((c) => c.status === 'in_progress' && c.finalMark !== 100);

        // Verify only these candidates' primary campus (targeted, batched)
        // instead of paging the whole campus. `null` = unverifiable this cycle
        // → skip creation and campus-based cancellation (deregistration cleanup
        // below still runs; it only needs the roster).
        let validCampus: Set<string> | null = null;
        try {
          validCampus = await this.school42Service.filterToPrimaryCampus(
            candidates.map((c) => c.login),
          );
          // A non-empty candidate set matching nobody is suspicious (bad API
          // shape or a transient blip) — refuse to act rather than let
          // cancelDeregisteredMarkets void every real market as "not a cadet".
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

        // Active existing markets skip the create/revive branch below (it
        // would wrongly reset their live pools), but still need `examEndsAt`
        // backfilled — either they predate this field, or 42 rescheduled the
        // exam. A targeted UPDATE, no pool/status side effects.
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

          // A cadet who re-registers after a deregistration finds their old
          // (unique-indexed) market row still there, just CANCELLED — revive
          // it with a clean pool rather than skip creating a fresh one.
          if (existing && existing.status !== MarketStatus.CANCELLED) continue;

          const creatorId = await this.getOrCreateSystemBettorId();
          if (!creatorId) continue;

          // The admin (house) funds a fixed seed for every auto-generated
          // market, so its creation is ledgered rather than free. Skip this
          // cadet if the treasury can't cover it instead of minting.
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

  /**
   * Settles exam markets, but only once the exam session is over ("trancado")
   * AND the cadet's attempt is `finished` with a published grade. Waiting on
   * both matters because:
   *  - a still-`in_progress` attempt reports `finalMark` 0 by default (meaning
   *    "not graded yet", not "scored 0"); and
   *  - a 0 on a not-yet-locked exam is typically a cadet re-sitting after an
   *    earlier 0 — settling now would decide a bet they can still overturn,
   *    and a `finished`-with-0 record can even belong to a *future* session
   *    the cadet is re-registered for.
   * Betting already closes at the exam's start (`closesAt` / `placeBet`), so
   * delaying settlement never reopens a betting window.
   */
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

        // Only settle once the exam session is locked (over). Before that a
        // cadet's 0 can still be a pending re-sit rather than a final fail.
        if (Date.now() < new Date(exam.endAt).getTime()) continue;

        // Even after lock, require `finished` with a real grade — a lingering
        // `in_progress` (re-sitting elsewhere) reports a default 0 that isn't
        // this session's outcome.
        const roster = await this.school42Service.getExamRoster(exam);
        const gradedByLogin = new Map(
          roster
            .filter((c) => c.status === 'finished' && c.finalMark != null)
            .map((c) => [c.login, c.finalMark!]),
        );

        const marketsForExam = pending.filter((m) => m.examId === examId);
        for (const market of marketsForExam) {
          const finalMark = gradedByLogin.get(market.subjectLogin);
          if (finalMark == null) continue;

          const resolution = finalMark >= 100 ? MarketResolution.YES : MarketResolution.NO;
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
