import api from '../api';

export type MarketStatus = 'live' | 'closing' | 'new' | 'resolved' | 'cancelled';

export interface MarketDto {
  id: string;
  student: string;
  handle: string;
  avatar: string | null;
  category: string;
  project: string;
  probability: number;
  volume: string;
  volumeRaw: number;
  closes: string;
  status: MarketStatus;
  yesPrice: number;
  noPrice: number;
  resolution: 'YES' | 'NO' | null;
  creatorNick: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  nick: string;
  avatar: string;
  campus: string;
  pnl: string;
  winRate: string;
  totalBets: number;
}

export interface ActivityEntry {
  id: string;
  nick: string;
  avatar?: string;
  action: string;
  amount: string;
  market: string;
  time: string;
}

export interface CategoryStat {
  name: string;
  count: number;
}

export interface PlatformStats {
  liveMarkets: number;
  activeBettors: number;
  volume30d: number;
}

export interface PortfolioPosition {
  marketId: string;
  market: string;
  side: 'YES' | 'NO';
  entry: number;
  current: number;
  size: number;
  pnl: string;
}

export interface Portfolio {
  balance: number;
  pnl: string;
  open: number;
  resolved: number;
  winRate: number;
  positions: PortfolioPosition[];
}

/** Public aggregate betting stats for any bettor (no balance/positions). */
export interface BettorStats {
  nick: string;
  pnl: string;
  totalBets: number;
  wins: number;
  losses: number;
  open: number;
  winRate: number;
}

export interface SearchMarketResult {
  id: string;
  project: string;
  subjectLogin: string | null;
  subjectName: string | null;
  subjectAvatar: string | null;
  category: string;
  status: string;
}

export interface SearchBettorResult {
  nick: string;
  avatar: string | null;
  campus: string | null;
}

export interface GlobalSearchResults {
  markets: SearchMarketResult[];
  bettors: SearchBettorResult[];
}

/** One entry of a bettor's public bet history. */
export interface BettorPosition {
  id: string;
  marketId: string;
  market: string;
  subject: string | null;
  side: 'YES' | 'NO';
  amount: number;
  entry: number;
  payout: number | null;
  pnl: string | null;
  status: 'WON' | 'LOST' | 'OPEN' | 'CANCELLED';
  createdAt: string;
}

function unwrap<T>(res: any): T {
  return res.data?.data as T;
}

export const marketApi = {
  getTrending: async (limit = 4): Promise<MarketDto[]> => {
    const res = await api.get('/market/trending', { params: { limit } });
    return unwrap<MarketDto[]>(res);
  },

  getAll: async (params?: { category?: string; status?: string; search?: string }): Promise<MarketDto[]> => {
    const res = await api.get('/market', { params });
    return unwrap<MarketDto[]>(res);
  },

  getOne: async (id: string): Promise<MarketDto> => {
    const res = await api.get(`/market/${id}`);
    return unwrap<MarketDto>(res);
  },

  getStats: async (): Promise<PlatformStats> => {
    const res = await api.get('/market/stats');
    return unwrap<PlatformStats>(res);
  },

  getLeaderboard: async (limit = 6): Promise<LeaderboardEntry[]> => {
    const res = await api.get('/market/leaderboard', { params: { limit } });
    return unwrap<LeaderboardEntry[]>(res);
  },

  getActivity: async (limit = 10): Promise<ActivityEntry[]> => {
    const res = await api.get('/market/activity', { params: { limit } });
    return unwrap<ActivityEntry[]>(res);
  },

  getCategories: async (): Promise<CategoryStat[]> => {
    const res = await api.get('/market/categories');
    return unwrap<CategoryStat[]>(res);
  },

  getPortfolio: async (): Promise<Portfolio> => {
    const res = await api.get('/market/portfolio');
    return unwrap<Portfolio>(res);
  },

  getBettorStats: async (nick: string): Promise<BettorStats> => {
    const res = await api.get(`/market/bettor/${encodeURIComponent(nick)}/stats`);
    return unwrap<BettorStats>(res);
  },

  search: async (q: string): Promise<GlobalSearchResults> => {
    const res = await api.get('/market/search', { params: { q } });
    return unwrap<GlobalSearchResults>(res);
  },

  getBettorPositions: async (nick: string, limit = 50): Promise<BettorPosition[]> => {
    const res = await api.get(`/market/bettor/${encodeURIComponent(nick)}/positions`, {
      params: { limit },
    });
    return unwrap<BettorPosition[]>(res);
  },

  placeBet: async (marketId: string, side: 'YES' | 'NO', amount: number) => {
    const res = await api.post(`/market/${marketId}/bet`, { side, amount });
    return unwrap(res);
  },

  create: async (dto: {
    subjectLogin: string;
    subjectName: string;
    subjectAvatar?: string;
    project: string;
    category: string;
    closesAt: string;
  }) => {
    const res = await api.post('/market', dto);
    return unwrap(res);
  },

  resolveMarket: async (marketId: string, resolution: 'YES' | 'NO') => {
    const res = await api.patch(`/market/${marketId}/resolve`, { resolution });
    return unwrap(res);
  },
};
