import { useLoaderData } from 'react-router-dom';
import { Crown, Flame, TrendingUp, Zap } from 'lucide-react';
import type { ActivityEntry, LeaderboardEntry } from '@/api/market/market.api';
import { marketApi } from '@/api/market/market.api';

export interface LeaderboardLoaderData {
  leaderboard: LeaderboardEntry[];
  activity: ActivityEntry[];
}

export async function leaderboardLoader(): Promise<LeaderboardLoaderData> {
  try {
    const [leaderboard, activity] = await Promise.all([
      marketApi.getLeaderboard(10),
      marketApi.getActivity(10),
    ]);
    return { leaderboard, activity };
  } catch {
    return { leaderboard: [], activity: [] };
  }
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const rankIcon: Record<number, React.ReactNode> = {
  1: <Crown className="h-4 w-4 text-warning" />,
  2: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
  3: <Flame className="h-4 w-4 text-orange-500" />,
};

export function Leaderboard() {
  // Falls back to empty data when rendered as the frozen background behind the
  // auth modal (route inactive → loader data purged), instead of crashing.
  const { leaderboard, activity } =
    (useLoaderData() as LeaderboardLoaderData | undefined) ?? { leaderboard: [], activity: [] };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-warning">
          <Crown className="h-3 w-3" /> Rankings
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          Top predictors ranked by profit & loss across all markets.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Leaderboard table */}
        <div className="rounded-2xl border border-border/60 bg-gradient-card overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_92px] gap-3 border-b border-border/50 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:grid-cols-[40px_1fr_100px_80px_80px] sm:gap-4 sm:px-5">
            <span>#</span>
            <span>Bettor</span>
            <span className="text-right">P&amp;L</span>
            <span className="hidden text-right sm:block">Win rate</span>
            <span className="hidden text-right sm:block">Bets</span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              No bettors yet — be the first!
            </div>
          ) : (
            leaderboard.map((entry) => {
              const pnlNum = parseFloat(entry.pnl);
              const isPos = pnlNum >= 0;
              return (
                <div
                  key={entry.nick}
                  className="grid grid-cols-[32px_1fr_92px] items-center gap-3 border-b border-border/30 px-4 py-4 last:border-0 hover:bg-surface/50 transition sm:grid-cols-[40px_1fr_100px_80px_80px] sm:gap-4 sm:px-5"
                >
                  <div className="flex items-center justify-center">
                    {rankIcon[entry.rank] ?? (
                      <span className="font-mono text-sm text-muted-foreground">{entry.rank}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={entry.avatar}
                      alt={entry.nick}
                      className="h-9 w-9 shrink-0 rounded-xl object-cover bg-surface"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm">{entry.nick}</p>
                      {entry.campus && (
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          {entry.campus}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className={`text-right font-mono text-sm font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                    {isPos ? '+' : ''}xp {Math.abs(pnlNum).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="hidden text-right font-mono text-sm text-muted-foreground sm:block">{entry.winRate}</p>
                  <p className="hidden text-right font-mono text-sm text-muted-foreground sm:block">{entry.totalBets}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl border border-border/60 bg-gradient-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Live Activity
            </span>
          </div>
          <div className="divide-y divide-border/30">
            {activity.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No activity yet.
              </div>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  {a.avatar ? (
                    <img src={a.avatar} alt={a.nick} className="h-7 w-7 shrink-0 rounded-lg object-cover bg-surface mt-0.5" />
                  ) : (
                    <div className="h-7 w-7 shrink-0 rounded-lg bg-surface mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{a.nick}</span>{' '}
                      <span className={a.action.startsWith('bought YES') ? 'text-success' : a.action.startsWith('bought NO') ? 'text-destructive' : 'text-muted-foreground'}>
                        {a.action}
                      </span>{' '}
                      {a.amount && (
                        <span className="font-mono text-xs font-semibold">{a.amount}</span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.market}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {timeAgo(a.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
