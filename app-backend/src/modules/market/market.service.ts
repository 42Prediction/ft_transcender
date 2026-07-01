import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { In, Not, Repository } from 'typeorm';
import { Market, MarketCategory, MarketResolution, MarketStatus } from './entities/market.entity';
import { BetSide, MarketPosition } from './entities/market-position.entity';
import { Bettor } from '../bettor/entities/bettor.entity';
import { User } from '../user/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';
import { CreateMarketDto } from './dto/create-market.dto';
import { PlaceBetDto } from './dto/place-bet.dto';
import { MarketGateway } from './market.gateway';
import { createAvatar } from '@dicebear/core';
import { avataaarsNeutral } from '@dicebear/collection';

@Injectable()
export class MarketService {
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
  ) {}

  async findAll(category?: string, status?: string, search?: string) {
    const qb = this.marketRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.creator', 'creator')
      .orderBy('(m.yes_pool + m.no_pool)', 'DESC');

    if (category && category !== 'All') {
      qb.andWhere('m.category = :category', { category });
    }
    if (status) {
      qb.andWhere('m.status = :status', { status });
    } else {
      // Default view only shows active markets — resolved/cancelled markets are
      // hidden unless a status is explicitly requested.
      qb.andWhere('m.status NOT IN (:...inactive)', {
        inactive: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
      });
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
      // Auto-provision bettor for admin users created via seed
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      const avatar = createAvatar(avataaarsNeutral, { seed: user.email }).toDataUri();
      const prefix = user.email.split('@')[0].substring(0, 20).replace(/[^a-zA-Z0-9_.]/g, '');
      bettor = await this.bettorRepo.save(
        this.bettorRepo.create({ nick: `${prefix}_${Math.floor(1000 + Math.random() * 9000)}`, avatar, user }),
      );
      await this.walletService.createWallet(bettor.id);
    }

    const market = this.marketRepo.create({
      subjectLogin: dto.subjectLogin,
      subjectName: dto.subjectName,
      subjectAvatar: dto.subjectAvatar,
      project: dto.project,
      category: dto.category,
      closesAt: new Date(dto.closesAt),
      creatorId: bettor.id,
      status: this.computeStatus(new Date(dto.closesAt), new Date()),
    });

    const saved = await this.marketRepo.save(market);
    const payload = this.toDto(saved);
    this.marketGateway.emitMarketUpdate(payload);
    return payload;
  }

  async placeBet(marketId: string, userId: string, dto: PlaceBetDto) {
    const market = await this.marketRepo.findOne({ where: { id: marketId } });
    if (!market) throw new NotFoundException('Market not found');
    if (market.status === MarketStatus.RESOLVED)
      throw new BadRequestException('Market is already resolved');

    const bettor = await this.bettorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!bettor) throw new NotFoundException('Bettor not found');

    // Debit wallet first (has its own transaction + pessimistic lock)
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

  async resolveMarket(id: string, resolution: MarketResolution) {
    const market = await this.marketRepo.findOne({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');
    if (market.status === MarketStatus.RESOLVED)
      throw new BadRequestException('Market already resolved');

    market.resolution = resolution;
    market.status = MarketStatus.RESOLVED;
    market.resolvedAt = new Date();
    await this.marketRepo.save(market);
    this.marketGateway.emitMarketUpdate(this.toDto(market));
    this.marketGateway.emitMarketRemoved(market.id);

    const positions = await this.positionRepo.find({ where: { marketId: id } });
    const winSide = resolution === MarketResolution.YES ? BetSide.YES : BetSide.NO;
    const winners = positions.filter((p) => p.side === winSide);
    const totalWinShares = winners.reduce((s, p) => s + Number(p.shares), 0);
    const totalPool = Number(market.yesPool) + Number(market.noPool);

    for (const pos of winners) {
      const payout = (Number(pos.shares) / totalWinShares) * totalPool;
      pos.payout = payout;
      await this.positionRepo.save(pos);

      await this.walletService.credit(pos.bettorId, {
        amount: payout,
        type: TransactionType.PAYOUT,
        description: `Payout for ${resolution} on market: ${market.project}`,
      });
    }

    return { resolved: true, resolution, totalPool, winnersCount: winners.length };
  }

  /**
   * Voids a market — e.g. an auto-generated exam market whose cadet
   * deregistered before the exam ended. Every position is refunded in full
   * (not a payout, since the event no longer resolves either way).
   */
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
    for (const pos of positions) {
      if (pos.payout != null) continue;
      pos.payout = pos.amount;
      await this.positionRepo.save(pos);

      await this.walletService.credit(pos.bettorId, {
        amount: Number(pos.amount),
        type: TransactionType.PAYOUT,
        description: `Refund: market cancelled (${reason}) — ${market.project}`,
      });
    }

    return { cancelled: true, refundedPositions: positions.length };
  }

  async getStats() {
    const [liveCount, totalBettors] = await Promise.all([
      this.marketRepo.count({
        where: [
          { status: MarketStatus.LIVE },
          { status: MarketStatus.CLOSING },
          { status: MarketStatus.NEW },
        ],
      }),
      this.bettorRepo.count(),
    ]);

    const volumeResult = await this.marketRepo
      .createQueryBuilder('m')
      .select('SUM(m.yes_pool + m.no_pool - 200)', 'totalVolume')
      .getRawOne();

    return {
      liveMarkets: liveCount,
      activeBettors: totalBettors,
      volume30d: Math.max(0, Number(volumeResult?.totalVolume) || 0),
    };
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
        ? `+₳ ${Number(pos.payout).toFixed(2)}`
        : `₳ ${Number(pos.amount).toFixed(2)}`,
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

  async getCategoryStats() {
    const rows = await this.marketRepo
      .createQueryBuilder('m')
      .select('m.category', 'category')
      .addSelect('COUNT(m.id)', 'count')
      .where('m.status NOT IN (:...inactive)', {
        inactive: [MarketStatus.RESOLVED, MarketStatus.CANCELLED],
      })
      .groupBy('m.category')
      .getRawMany();

    const countByCategory = new Map(rows.map((r) => [r.category, Number(r.count)]));
    const all = rows.reduce((s, r) => s + Number(r.count), 0);

    // Always list the full Exam 02-06 scope, even with zero markets right
    // now, so the /markets filter buttons are stable rather than appearing
    // and disappearing as exams come and go.
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
    if (diff < 0) return MarketStatus.RESOLVED;
    if (diff < 24 * 60 * 60 * 1000) return MarketStatus.CLOSING;
    if (createdAt) {
      const ageHours = (now.getTime() - createdAt.getTime()) / (60 * 60 * 1000);
      return ageHours < 48 ? MarketStatus.NEW : MarketStatus.LIVE;
    }
    return MarketStatus.LIVE;
  }

  /**
   * Markets close purely based on time (`closesAt`), so status can go stale
   * between requests. Recompute it periodically and broadcast anything that
   * changed so connected clients stay in sync without polling.
   */
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
      volume: `₳ ${(total - 200).toFixed(0)}`,
      volumeRaw: total - 200,
      closes: market.closesAt,
      status: market.status,
      yesPrice,
      noPrice,
      resolution: market.resolution ?? null,
      creatorNick: market.creator?.nick ?? null,
    };
  }
}
