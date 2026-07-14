import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { In, Not, Repository } from 'typeorm';
import { Market, MarketCategory, MarketResolution, MarketStatus } from './entities/market.entity';
import { BetSide, MarketPosition } from './entities/market-position.entity';
import { Bettor } from '../bettor/entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { ADMIN_TREASURY_BALANCE, WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';
import { Role } from '../../shared/enums/roles.enum';
import { CreateMarketDto } from './dto/create-market.dto';
import { PlaceBetDto } from './dto/place-bet.dto';
import { MarketGateway } from './market.gateway';
import { NotificationService } from './notification.service';
import { NotificationType } from './entities/notification.entity';
import { createAvatar } from '@dicebear/core';
import { avataaarsNeutral } from '@dicebear/collection';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  /**
   * House rake: the fraction of the losing side's total stake that the market
   * creator (admin) collects on each resolution. Carved out of the pool before
   * winners are paid, so winners split the pool net of rake.
   */
  private static readonly HOUSE_RAKE_RATE = 0.05;

  /**
   * Initial liquidity seeded into each side of a new market's pool. The admin
   * funds it from their own wallet on creation (see `create`), so the seed that
   * winners ultimately collect at resolution is real, ledgered money rather
   * than currency minted from nowhere.
   */
  private static readonly MARKET_SEED_PER_SIDE = 100;

  constructor(
    @InjectRepository(Market)
    private readonly marketRepo: Repository<Market>,
    @InjectRepository(MarketPosition)
    private readonly positionRepo: Repository<MarketPosition>,
    @InjectRepository(Bettor)
    private readonly bettorRepo: Repository<Bettor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly walletService: WalletService,
    private readonly marketGateway: MarketGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(category?: string, status?: string, search?: string) {
    const qb = this.marketRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.creator', 'creator')
      .orderBy('(m.yes_pool + m.no_pool)', 'DESC');

    if (category && category !== 'All') {
      qb.andWhere('m.category = :category', { category });
    }
    if (status === 'closed') {
      qb.andWhere(
        '(m.status IN (:...settled) OR m.closes_at <= :now)',
        { settled: [MarketStatus.RESOLVED, MarketStatus.CANCELLED], now: new Date() },
      );
    } else if (status) {
      qb.andWhere('m.status = :status', { status });
    } else {

      qb.andWhere('m.status NOT IN (:...inactive)', {
        inactive: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
      });
      qb.andWhere('m.closes_at > :now', { now: new Date() });
    }
    if (search) {
      qb.andWhere(
        '(m.subject_login ILIKE :s OR m.subject_name ILIKE :s OR m.project ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const markets = await qb.getMany();
    return markets.map(this.toDto);
  }

  async findTrending(limit = 4) {
    const markets = await this.marketRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.creator', 'creator')
      .where('m.status NOT IN (:...inactive)', {
        inactive: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
      })

      .andWhere('m.closes_at > :now', { now: new Date() })
      .orderBy('(m.yes_pool + m.no_pool)', 'DESC')
      .limit(limit)
      .getMany();

    return markets.map(this.toDto);
  }

  async findOne(id: string) {
    const market = await this.marketRepo.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!market) throw new NotFoundException('Market not found');
    return this.toDto(market);
  }

  async create(dto: CreateMarketDto, userId: string) {
    let bettor = await this.bettorRepo.findOne({ where: { user: { id: userId } } });
    if (!bettor) {
     
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      const avatar = createAvatar(avataaarsNeutral, { seed: user.email }).toDataUri();
      const prefix = user.email.split('@')[0].substring(0, 20).replace(/[^a-zA-Z0-9_.]/g, '');
      bettor = await this.bettorRepo.save(
        this.bettorRepo.create({ nick: `${prefix}_${Math.floor(1000 + Math.random() * 9000)}`, avatar, user }),
      );
     
      await this.walletService.createWallet(bettor.id, ADMIN_TREASURY_BALANCE, 'Admin treasury');
    }

    const seedPerSide = MarketService.MARKET_SEED_PER_SIDE;
    const market = this.marketRepo.create({
      subjectLogin: dto.subjectLogin,
      subjectName: dto.subjectName,
      subjectAvatar: dto.subjectAvatar,
      project: dto.project,
      category: dto.category,
      closesAt: new Date(dto.closesAt),
      creatorId: bettor.id,
      yesPool: seedPerSide,
      noPool: seedPerSide,
      status: this.computeStatus(new Date(dto.closesAt), new Date()),
    });

    const saved = await this.marketRepo.save(market);

  
    try {
      await this.walletService.debit(bettor.id, {
        amount: seedPerSide * 2,
        type: TransactionType.MARKET_SEED,
        description: `Seed liquidity for market: ${dto.project}`,
      });
    } catch (err) {
      await this.marketRepo.remove(saved);
      throw err;
    }

    const payload = this.toDto(saved);
    this.marketGateway.emitMarketUpdate(payload);
    return payload;
  }

  async placeBet(marketId: string, userId: string, dto: PlaceBetDto) {
    const market = await this.marketRepo.findOne({ where: { id: marketId } });
    if (!market) throw new NotFoundException('Market not found');
    if (market.status === MarketStatus.RESOLVED || market.status === MarketStatus.CANCELLED)
      throw new BadRequestException('Market is no longer open');
    if (new Date() >= market.closesAt)
      throw new BadRequestException('Betting is closed for this market');

    const bettor = await this.bettorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!bettor) throw new NotFoundException('Bettor not found');

   
    await this.walletService.debit(bettor.id, {
      amount: dto.amount,
      type: TransactionType.BET,
      description: `Bet ${dto.side} on market: ${market.project}`,
    });

    const yesPool = Number(market.yesPool);
    const noPool = Number(market.noPool);
    const totalPool = yesPool + noPool;
    const entryPrice = dto.side === BetSide.YES
      ? yesPool / totalPool
      : noPool / totalPool;
    const shares = dto.amount / entryPrice;

    if (dto.side === BetSide.YES) {
      market.yesPool = yesPool + dto.amount;
    } else {
      market.noPool = noPool + dto.amount;
    }
    market.status = this.computeStatus(market.closesAt, new Date(), market.createdAt);
    await this.marketRepo.save(market);
    this.marketGateway.emitMarketUpdate(this.toDto(market));

    const position = this.positionRepo.create({
      marketId: market.id,
      bettorId: bettor.id,
      side: dto.side,
      amount: dto.amount,
      shares,
      entryPrice,
    });
    await this.positionRepo.save(position);

    return { position: position.id, entryPrice, shares };
  }

  
  async resolveMarketManually(id: string, userId: string, resolution?: MarketResolution) {
    const market = await this.marketRepo.findOne({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');

    // Exam-sourced markets belong exclusively to the automatic pipeline: they
    // resolve on their own the moment the exam window ends (100 → YES, anything
    // else → NO). Nobody resolves them by hand.
    if (market.examId != null) {
      throw new BadRequestException(
        'This market is sourced from a 42 exam and resolves automatically when the exam ends.',
      );
    }

    // Manual markets can only be settled by whoever created them — being an
    // admin or moderator is not enough on its own.
    const bettor = await this.bettorRepo.findOne({ where: { user: { id: userId } } });
    if (!bettor || market.creatorId !== bettor.id) {
      throw new ForbiddenException('Only the creator of this market can resolve it.');
    }

    if (!resolution) {
      throw new BadRequestException('Resolution (YES/NO) is required.');
    }
    return this.resolveMarket(id, resolution);
  }

  async resolveMarket(id: string, resolution: MarketResolution, finalGrade?: number) {
    const market = await this.marketRepo.findOne({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');
    if (market.status === MarketStatus.RESOLVED)
      throw new BadRequestException('Market already resolved');

    market.resolution = resolution;
    market.status = MarketStatus.RESOLVED;
    market.resolvedAt = new Date();
    if (finalGrade != null) market.finalGrade = finalGrade;
    await this.marketRepo.save(market);
    this.marketGateway.emitMarketUpdate(this.toDto(market));
    this.marketGateway.emitMarketRemoved(market.id);

    const positions = await this.positionRepo.find({ where: { marketId: id } });
    const winSide = resolution === MarketResolution.YES ? BetSide.YES : BetSide.NO;
    const winners = positions.filter((p) => p.side === winSide);
    const totalWinShares = winners.reduce((s, p) => s + Number(p.shares), 0);
    const totalPool = Number(market.yesPool) + Number(market.noPool);

  
    const losersStake = positions
      .filter((p) => p.side !== winSide)
      .reduce((s, p) => s + Number(p.amount), 0);
    const rake = Number((losersStake * MarketService.HOUSE_RAKE_RATE).toFixed(2));
    const distributable = totalPool - rake;

   
    const notifications: {
      bettorId: string;
      type: NotificationType;
      marketId: string;
      data: Record<string, unknown>;
    }[] = [];

    for (const pos of positions) {
      const won = pos.side === winSide;
      const payout = won ? (Number(pos.shares) / totalWinShares) * distributable : 0;
      pos.payout = payout;
      await this.positionRepo.save(pos);

      if (won && payout > 0) {
        await this.walletService.credit(pos.bettorId, {
          amount: payout,
          type: TransactionType.PAYOUT,
          description: `Payout for ${resolution} on market: ${market.project}`,
        });
      }

      notifications.push({
        bettorId: pos.bettorId,
        type: NotificationType.BET_RESOLVED,
        marketId: market.id,
        data: {
          project: market.project,
          subject: market.subjectLogin ?? null,
          side: pos.side,
          resolution,
          outcome: won && payout > 0 ? 'won' : 'lost',
          amount: Number(pos.amount),
          payout,
          pnl: Number((payout - Number(pos.amount)).toFixed(2)),
        },
      });
    }


    // Credit the creator. Normally that's just the house rake carved from the
    // losing side. But when there are no winning positions (nobody bet, or every
    // bet landed on the losing side) the loop above distributes nothing, so the
    // whole pool — the admin's seed liquidity plus any forfeited losing stakes —
    // would otherwise be stranded and lost. Hand it all back to the creator.
    const noWinners = totalWinShares === 0;
    const creatorCredit = noWinners ? totalPool : rake;
    if (creatorCredit > 0) {
      try {
        await this.walletService.credit(market.creatorId, {
          amount: creatorCredit,
          type: TransactionType.COMMISSION,
          description: noWinners
            ? `Seed refund (no winners) on market: ${market.project}`
            : `House rake (${(MarketService.HOUSE_RAKE_RATE * 100).toFixed(0)}%) on market: ${market.project}`,
        });
      } catch (err) {
        this.logger.warn(
          `Creator credit of ${creatorCredit} to ${market.creatorId} failed on market ${market.id}: ${err}`,
        );
      }
    }

    await this.notificationService.createMany(notifications);

    return { resolved: true, resolution, totalPool, rake, winnersCount: winners.length };
  }

  async cancelMarket(id: string, reason: string) {
    const market = await this.marketRepo.findOne({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');
    if (market.status === MarketStatus.RESOLVED || market.status === MarketStatus.CANCELLED) {
      return;
    }

    market.status = MarketStatus.CANCELLED;
    market.resolvedAt = new Date();
    await this.marketRepo.save(market);
    this.marketGateway.emitMarketUpdate(this.toDto(market));
    this.marketGateway.emitMarketRemoved(market.id);

    const positions = await this.positionRepo.find({ where: { marketId: id } });
    const notifications: {
      bettorId: string;
      type: NotificationType;
      marketId: string;
      data: Record<string, unknown>;
    }[] = [];

    for (const pos of positions) {
      if (pos.payout != null) continue;
      pos.payout = pos.amount;
      await this.positionRepo.save(pos);

      await this.walletService.credit(pos.bettorId, {
        amount: Number(pos.amount),
        type: TransactionType.PAYOUT,
        description: `Refund: market cancelled (${reason}) — ${market.project}`,
      });

      notifications.push({
        bettorId: pos.bettorId,
        type: NotificationType.BET_CANCELLED,
        marketId: market.id,
        data: {
          project: market.project,
          subject: market.subjectLogin ?? null,
          side: pos.side,
          amount: Number(pos.amount),
          reason,
        },
      });
    }

    await this.notificationService.createMany(notifications);

    return { cancelled: true, refundedPositions: positions.length };
  }

  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [liveMarkets, activeRow, volumeRow] = await Promise.all([
   
      this.marketRepo
        .createQueryBuilder('m')
        .where('m.status NOT IN (:...inactive)', {
          inactive: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
        })
        .andWhere('m.closes_at > :now', { now })
        .getCount(),

      this.positionRepo
        .createQueryBuilder('pos')
        .innerJoin('pos.bettor', 'b')
        .innerJoin('b.user', 'u')
        .where('u.role != :admin', { admin: Role.ADMIN })
        .select('COUNT(DISTINCT pos.bettor_id)', 'n')
        .getRawOne(),

      this.positionRepo
        .createQueryBuilder('pos')
        .innerJoin('pos.bettor', 'b')
        .innerJoin('b.user', 'u')
        .where('u.role != :admin', { admin: Role.ADMIN })
        .andWhere('pos.created_at >= :since', { since: thirtyDaysAgo })
        .select('COALESCE(SUM(pos.amount), 0)', 'v')
        .getRawOne(),
    ]);

    return {
      liveMarkets,
      activeBettors: Number(activeRow?.n) || 0,
      volume30d: Number(volumeRow?.v) || 0,
    };
  }


  async getPriceHistory(id: string) {
    const market = await this.marketRepo.findOne({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');

    const positions = await this.positionRepo.find({
      where: { marketId: id },
      order: { createdAt: 'ASC' },
    });

    const seed = MarketService.MARKET_SEED_PER_SIDE;
    let yes = seed;
    let no = seed;
    const point = (t: Date) => {
      const total = yes + no;
      const yesPct = Math.round((yes / total) * 100);
      return { t: t.toISOString(), yes: yesPct, no: 100 - yesPct };
    };

    const history = [point(market.createdAt)];
    for (const pos of positions) {
      if (pos.side === BetSide.YES) yes += Number(pos.amount);
      else no += Number(pos.amount);
      history.push(point(pos.createdAt));
    }

    const now = new Date();
    const last = history[history.length - 1];
    if (last.t !== now.toISOString()) history.push(point(now));

    return history;
  }

  async getLeaderboard(limit = 6) {
    const rows = await this.positionRepo
      .createQueryBuilder('pos')
      .select('pos.bettor_id', 'bettorId')
      .addSelect('b.nick', 'nick')
      .addSelect('b.avatar', 'avatar')
      .addSelect('b.campus', 'campus')
      .addSelect('SUM(CASE WHEN pos.payout IS NOT NULL THEN pos.payout ELSE 0 END) - SUM(pos.amount)', 'pnl')
      .addSelect('COUNT(DISTINCT pos.id)', 'totalBets')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN pos.payout > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT pos.id), 0), 0)',
        'winRate',
      )
      .innerJoin(Bettor, 'b', 'b.id = pos.bettor_id')
      .groupBy('pos.bettor_id')
      .addGroupBy('b.nick')
      .addGroupBy('b.avatar')
      .addGroupBy('b.campus')
      .orderBy('pnl', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((r, i) => ({
      rank: i + 1,
      nick: r.nick,
      avatar: r.avatar,
      campus: r.campus,
      pnl: Number(r.pnl).toFixed(2),
      winRate: `${r.winRate ?? 0}%`,
      totalBets: Number(r.totalBets),
    }));
  }

  async getActivity(limit = 10) {
    const positions = await this.positionRepo
      .createQueryBuilder('pos')
      .leftJoinAndSelect('pos.bettor', 'bettor')
      .leftJoinAndSelect('pos.market', 'market')
      .orderBy('pos.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return positions.map((pos) => ({
      id: pos.id,
      nick: pos.bettor?.nick ?? 'unknown',
      avatar: pos.bettor?.avatar,
      action: pos.payout != null ? 'resolved' : `bought ${pos.side}`,
      amount: pos.payout != null
        ? `+xp ${Number(pos.payout).toFixed(2)}`
        : `xp ${Number(pos.amount).toFixed(2)}`,
      market: pos.market?.project ?? '',
      time: pos.createdAt,
    }));
  }

  async getMyPortfolio(userId: string) {
    const bettor = await this.bettorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['wallet'],
    });
    if (!bettor) throw new NotFoundException('Bettor not found');

    const positions = await this.positionRepo
      .createQueryBuilder('pos')
      .leftJoinAndSelect('pos.market', 'market')
      .where('pos.bettor_id = :bettorId', { bettorId: bettor.id })
      .andWhere('market.status NOT IN (:...inactive)', {
        inactive: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
      })
      .orderBy('pos.created_at', 'DESC')
      .getMany();

    const resolved = await this.positionRepo
      .createQueryBuilder('pos')
      .select('SUM(COALESCE(pos.payout, 0)) - SUM(pos.amount)', 'totalPnl')
      .addSelect('COUNT(DISTINCT pos.market_id)', 'resolved')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN pos.payout > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'winRate',
      )
      .where('pos.bettor_id = :bettorId', { bettorId: bettor.id })
      .getRawOne();

    return {
      balance: Number(bettor.wallet?.balance ?? 0),
      pnl: Number(resolved?.totalPnl ?? 0).toFixed(2),
      open: positions.length,
      resolved: Number(resolved?.resolved ?? 0),
      winRate: Number(resolved?.winRate ?? 0),
      positions: positions.map((pos) => {
        const market = pos.market;
        const yesPool = Number(market.yesPool);
        const noPool = Number(market.noPool);
        const total = yesPool + noPool;
        const currentPrice = pos.side === BetSide.YES ? yesPool / total : noPool / total;
        const currentValue = Number(pos.shares) * currentPrice;
        const positionPnl = currentValue - Number(pos.amount);
        return {
          marketId: market.id,
          market: market.project,
          side: pos.side,
          entry: Number(pos.entryPrice),
          current: currentPrice,
          size: Number(pos.amount),
          pnl: positionPnl.toFixed(2),
        };
      }),
    };
  }

 
  async getMyActivity(userId: string, from?: string, to?: string) {
    const bettor = await this.bettorRepo.findOne({ where: { user: { id: userId } } });
    if (!bettor) throw new NotFoundException('Bettor not found');

    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const seriesRows = await this.positionRepo
      .createQueryBuilder('pos')
      .where('pos.bettor_id = :bettorId', { bettorId: bettor.id })
      .andWhere('pos.created_at >= :from', { from: fromDate })
      .andWhere('pos.created_at <= :to', { to: toDate })
      .select("date_trunc('day', pos.created_at)", 'day')
      .addSelect('SUM(pos.amount)', 'wagered')
      .addSelect('SUM(COALESCE(pos.payout, 0))', 'payout')
      .addSelect('COUNT(*)', 'bets')
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    const categoryRows = await this.positionRepo
      .createQueryBuilder('pos')
      .innerJoin('pos.market', 'm')
      .where('pos.bettor_id = :bettorId', { bettorId: bettor.id })
      .andWhere('pos.created_at >= :from', { from: fromDate })
      .andWhere('pos.created_at <= :to', { to: toDate })
      .select('m.category', 'category')
      .addSelect('SUM(pos.amount)', 'wagered')
      .addSelect('COUNT(*)', 'bets')
      .groupBy('m.category')
      .orderBy('wagered', 'DESC')
      .getRawMany();

    const series = seriesRows.map((r) => ({
      date: new Date(r.day).toISOString().slice(0, 10),
      wagered: Number(r.wagered) || 0,
      payout: Number(r.payout) || 0,
      bets: Number(r.bets) || 0,
    }));
    const categories = categoryRows.map((r) => ({
      category: r.category,
      wagered: Number(r.wagered) || 0,
      bets: Number(r.bets) || 0,
    }));
    const totals = series.reduce(
      (acc, p) => ({
        wagered: acc.wagered + p.wagered,
        payout: acc.payout + p.payout,
        bets: acc.bets + p.bets,
      }),
      { wagered: 0, payout: 0, bets: 0 },
    );

    return { from: fromDate.toISOString(), to: toDate.toISOString(), series, categories, totals };
  }

  
  async getBettorStats(nick: string) {
    const bettor = await this.bettorRepo.findOne({ where: { nick } });
    if (!bettor) throw new NotFoundException('Bettor not found');

    const agg = await this.positionRepo
      .createQueryBuilder('pos')
      .select('SUM(COALESCE(pos.payout, 0)) - SUM(pos.amount)', 'pnl')
      .addSelect('COUNT(*)', 'totalBets')
      .addSelect('SUM(CASE WHEN pos.payout > 0 THEN 1 ELSE 0 END)', 'wins')
      .addSelect(
        'SUM(CASE WHEN pos.payout IS NOT NULL AND pos.payout <= 0 THEN 1 ELSE 0 END)',
        'losses',
      )
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN pos.payout > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'winRate',
      )
      .where('pos.bettor_id = :bettorId', { bettorId: bettor.id })
      .getRawOne();

    const open = await this.positionRepo
      .createQueryBuilder('pos')
      .innerJoin('pos.market', 'market')
      .where('pos.bettor_id = :bettorId', { bettorId: bettor.id })
      .andWhere('market.status NOT IN (:...inactive)', {
        inactive: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
      })
      .getCount();

    return {
      nick: bettor.nick,
      pnl: Number(agg?.pnl ?? 0).toFixed(2),
      totalBets: Number(agg?.totalBets ?? 0),
      wins: Number(agg?.wins ?? 0),
      losses: Number(agg?.losses ?? 0),
      open,
      winRate: Number(agg?.winRate ?? 0),
    };
  }

 
  async getBettorPositions(nick: string, limit = 50) {
    const bettor = await this.bettorRepo.findOne({ where: { nick } });
    if (!bettor) throw new NotFoundException('Bettor not found');

    const positions = await this.positionRepo
      .createQueryBuilder('pos')
      .leftJoinAndSelect('pos.market', 'market')
      .where('pos.bettor_id = :bettorId', { bettorId: bettor.id })
      .orderBy('pos.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return positions.map((pos) => {
      const market = pos.market;
      let status: 'WON' | 'LOST' | 'OPEN' | 'CANCELLED';
      if (market.status === MarketStatus.CANCELLED) {
        status = 'CANCELLED';
      } else if (pos.payout != null) {
        status = Number(pos.payout) > 0 ? 'WON' : 'LOST';
      } else {
        status = 'OPEN';
      }
      const pnl = pos.payout != null ? Number(pos.payout) - Number(pos.amount) : null;

      return {
        id: pos.id,
        marketId: market.id,
        market: market.project,
        subject: market.subjectLogin ?? null,
        side: pos.side,
        amount: Number(pos.amount),
        entry: Number(pos.entryPrice),
        payout: pos.payout != null ? Number(pos.payout) : null,
        pnl: pnl != null ? pnl.toFixed(2) : null,
        status,
        createdAt: pos.createdAt,
      };
    });
  }

 
  async globalSearch(query: string) {
    const q = query.trim();
    if (q.length < 2) return { markets: [], bettors: [] };

    const like = `%${q}%`;
    const [markets, bettors] = await Promise.all([
      this.marketRepo
        .createQueryBuilder('m')
        .where(
          '(m.subject_login ILIKE :like OR m.subject_name ILIKE :like OR m.project ILIKE :like)',
          { like },
        )
        .orderBy('m.closes_at', 'DESC')
        .limit(8)
        .getMany(),
      this.bettorRepo
        .createQueryBuilder('b')
        .where('b.nick ILIKE :like', { like })
        .limit(8)
        .getMany(),
    ]);

    return {
      markets: markets.map((m) => ({
        id: m.id,
        project: m.project,
        subjectLogin: m.subjectLogin ?? null,
        subjectName: m.subjectName ?? null,
        subjectAvatar: m.subjectAvatar ?? null,
        category: m.category,
        status: m.status,
      })),
      bettors: bettors.map((b) => ({
        nick: b.nick,
        avatar: b.avatar ?? null,
        campus: b.campus ?? null,
      })),
    };
  }

  async searchStudents(query: string) {
    const bettors = await this.bettorRepo
      .createQueryBuilder('b')
      .where('b.nick ILIKE :q OR b.campus ILIKE :q', { q: `%${query}%` })
      .limit(10)
      .getMany();

    return bettors.map((b) => ({
      login: b.nick,
      name: b.nick,
      avatar: b.avatar,
      campus: b.campus,
    }));
  }

  
  async getAnalytics(from?: string, to?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const seriesRows = await this.positionRepo
      .createQueryBuilder('pos')
      .innerJoin('pos.bettor', 'b')
      .innerJoin('b.user', 'u')
      .where('u.role != :admin', { admin: Role.ADMIN })
      .andWhere('pos.created_at >= :from', { from: fromDate })
      .andWhere('pos.created_at <= :to', { to: toDate })
      .select("date_trunc('day', pos.created_at)", 'day')
      .addSelect('SUM(pos.amount)', 'volume')
      .addSelect('COUNT(*)', 'bets')
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    const categoryRows = await this.positionRepo
      .createQueryBuilder('pos')
      .innerJoin('pos.market', 'm')
      .innerJoin('pos.bettor', 'b')
      .innerJoin('b.user', 'u')
      .where('u.role != :admin', { admin: Role.ADMIN })
      .andWhere('pos.created_at >= :from', { from: fromDate })
      .andWhere('pos.created_at <= :to', { to: toDate })
      .select('m.category', 'category')
      .addSelect('SUM(pos.amount)', 'volume')
      .addSelect('COUNT(*)', 'bets')
      .groupBy('m.category')
      .orderBy('volume', 'DESC')
      .getRawMany();

    const series = seriesRows.map((r) => ({
      date: new Date(r.day).toISOString().slice(0, 10),
      volume: Number(r.volume) || 0,
      bets: Number(r.bets) || 0,
    }));
    const categories = categoryRows.map((r) => ({
      category: r.category,
      volume: Number(r.volume) || 0,
      bets: Number(r.bets) || 0,
    }));
    const totals = series.reduce(
      (acc, p) => ({ volume: acc.volume + p.volume, bets: acc.bets + p.bets }),
      { volume: 0, bets: 0 },
    );

    return { from: fromDate.toISOString(), to: toDate.toISOString(), series, categories, totals };
  }

  async getCategoryStats() {
    const rows = await this.marketRepo
      .createQueryBuilder('m')
      .select('m.category', 'category')
      .addSelect('COUNT(m.id)', 'count')
      .where('m.status NOT IN (:...inactive)', {
        inactive: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
      })
      .andWhere('m.closes_at > :now', { now: new Date() })
      .groupBy('m.category')
      .getRawMany();

    const countByCategory = new Map(rows.map((r) => [r.category, Number(r.count)]));
    const all = rows.reduce((s, r) => s + Number(r.count), 0);


    return [
      { name: 'All', count: all },
      ...Object.values(MarketCategory).map((category) => ({
        name: category,
        count: countByCategory.get(category) ?? 0,
      })),
    ];
  }


  computeStatus(closesAt: Date, now: Date, createdAt?: Date): MarketStatus {
    const diff = closesAt.getTime() - now.getTime();
    // Once the close time has passed the event is under way: betting is shut but
    // the market isn't resolved until a grade/verdict arrives (see resolveMarket).
    if (diff <= 0) return MarketStatus.CLOSED;
    if (diff < 24 * 60 * 60 * 1000) return MarketStatus.CLOSING;
    if (createdAt) {
      const ageHours = (now.getTime() - createdAt.getTime()) / (60 * 60 * 1000);
      return ageHours < 48 ? MarketStatus.NEW : MarketStatus.LIVE;
    }
    return MarketStatus.LIVE;
  }


  @Cron('*/15 * * * * *')
  async refreshMarketStatuses() {
    const markets = await this.marketRepo.find({
      where: { status: Not(In([MarketStatus.RESOLVED, MarketStatus.CANCELLED])) },
    });
    const now = new Date();

    for (const market of markets) {
      const nextStatus = this.computeStatus(market.closesAt, now, market.createdAt);
      if (nextStatus === market.status) continue;

      market.status = nextStatus;
      if (nextStatus === MarketStatus.RESOLVED) {
        market.resolvedAt = now;
      }
      await this.marketRepo.save(market);

      this.marketGateway.emitMarketUpdate(this.toDto(market));
      if (nextStatus === MarketStatus.RESOLVED) {
        this.marketGateway.emitMarketRemoved(market.id);
      }
    }
  }

  toDto(market: Market) {
    const yesPool = Number(market.yesPool);
    const noPool = Number(market.noPool);
    const total = yesPool + noPool;
    const yesPrice = yesPool / total;
    const noPrice = noPool / total;

    return {
      id: market.id,
      student: market.subjectName,
      handle: market.subjectLogin,
      avatar: market.subjectAvatar ?? null,
      category: market.category,
      project: market.project,
      probability: Math.round(yesPrice * 100),
      volume: `xp ${(total - 200).toFixed(0)}`,
      volumeRaw: total - 200,
      closes: market.closesAt,
      status: market.status,
      yesPrice,
      noPrice,
      resolution: market.resolution ?? null,
      creatorNick: market.creator?.nick ?? null,

      isAutoManaged: market.examId != null,

      examEndsAt: market.examEndsAt ?? null,

      finalGrade: market.finalGrade != null ? Number(market.finalGrade) : null,
    };
  }
}
