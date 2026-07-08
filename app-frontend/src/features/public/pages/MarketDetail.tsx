import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Link,
  useLoaderData,
  useLocation,
  useRevalidator,
  useRouteLoaderData,
  useSearchParams,
  type LoaderFunctionArgs,
} from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  Loader2,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { marketApi, type ActivityEntry, type MarketDto, type PricePoint } from '@/api/market/market.api';
import { cn } from '@/lib/utils';
import { useMarketUpdates } from '@/features/market/hooks/useMarketUpdates';
import { MarketChat } from '@/features/market/components/MarketChat';

/* ─── types ─────────────────────────────────────────── */

const RANGES = ['1H', '6H', '1D', '1W', '1M', 'ALL'] as const;
type Range = (typeof RANGES)[number];

export interface MarketDetailLoaderData {
  market: MarketDto;
  activity: ActivityEntry[];
  history: PricePoint[];
}

/* ─── loader ─────────────────────────────────────────── */

export async function marketDetailLoader({ params }: LoaderFunctionArgs): Promise<MarketDetailLoaderData> {
  const [market, activity, history] = await Promise.all([
    marketApi.getOne(params.id!),
    marketApi.getActivity(20),
    marketApi.getHistory(params.id!),
  ]);
  return { market, activity, history };
}

/* ─── chart helpers ──────────────────────────────────── */

type ChartPoint = { t: string; label: string; yes: number; no: number };

const RANGE_MS: Record<Range, number> = {
  '1H': 3600e3,
  '6H': 6 * 3600e3,
  '1D': 24 * 3600e3,
  '1W': 7 * 24 * 3600e3,
  '1M': 30 * 24 * 3600e3,
  ALL: Infinity,
};

function chartLabel(iso: string, range: Range): string {
  const d = new Date(iso);
  // Short windows read better as a time of day; longer ones as a date.
  return range === '1H' || range === '6H' || range === '1D'
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Real price history filtered to the selected window; falls back to the full
 *  series when the window holds fewer than two points, so the chart is never
 *  empty for a young market. */
function buildSeries(history: PricePoint[], range: Range): ChartPoint[] {
  const cutoff = Date.now() - RANGE_MS[range];
  let pts = history.filter((p) => new Date(p.t).getTime() >= cutoff);
  if (pts.length < 2) pts = history;
  return pts.map((p) => ({ ...p, label: chartLabel(p.t, range) }));
}

/* ─── small helpers ──────────────────────────────────── */

function dicebear(seed: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── page ───────────────────────────────────────────── */

export function MarketDetail() {
  // This page is also rendered as the frozen background behind the auth modal
  // (Sign in / Sign up). At that point its route is no longer active, so its
  // loader data is gone — bail out gracefully instead of destructuring
  // `undefined` and crashing the whole app.
  const loaderData = useLoaderData() as MarketDetailLoaderData | undefined;
  if (!loaderData?.market) return null;
  return <MarketDetailView loaderData={loaderData} />;
}

function MarketDetailView({ loaderData }: { loaderData: MarketDetailLoaderData }) {
  const { market: loaderMarket, activity, history } = loaderData;
  const [searchParams] = useSearchParams();
  const initialSide = (searchParams.get('side') === 'NO' ? 'NO' : 'YES') as 'YES' | 'NO';

  const [range, setRange] = useState<Range>('ALL');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>(initialSide);
  const [amount, setAmount] = useState(0);
  const [market, setMarket] = useState<MarketDto>(loaderMarket);

  useEffect(() => {
    setMarket(loaderMarket);
  }, [loaderMarket]);

  const handleMarketUpdate = useCallback(
    (updated: MarketDto) => {
      if (updated.id === loaderMarket.id) setMarket(updated);
    },
    [loaderMarket.id],
  );
  const handleMarketRemove = useCallback(() => {}, []);

  useMarketUpdates(handleMarketUpdate, handleMarketRemove);

  const data = useMemo(() => buildSeries(history, range), [history, range]);

  const sidePrice = betSide === 'YES' ? market.yesPrice : market.noPrice;
  const shares = amount > 0 ? (amount / sidePrice).toFixed(2) : '0.00';
  const payout = amount > 0 ? (amount / sidePrice).toFixed(2) : '0.00';

  return (
    <div>
      {/* breadcrumb */}
      <div className="border-b border-border/40 bg-background/60">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-3 text-xs text-muted-foreground">
          <Link to="/markets" className="hover:text-foreground transition">Markets</Link>
          <span>/</span>
          <span className="text-foreground/80">{market.category}</span>
          <span>/</span>
          <span className="font-mono text-foreground">@{market.handle}</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <MarketHeader market={market} />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <ChartCard data={data} range={range} setRange={setRange} market={market} />
            <StatsRow market={market} />
            <OutcomesTable market={market} />
            <RecentActivity activity={activity} />
            <MarketChat marketId={market.id} />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <TradePanel
              market={market}
              betSide={betSide}
              setBetSide={setBetSide}
              amount={amount}
              setAmount={setAmount}
              shares={shares}
              payout={payout}
            />
            <MarketInfoCard market={market} />
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ─── MarketHeader ───────────────────────────────────── */

function MarketHeader({ market }: { market: MarketDto }) {
  const yesPct = Math.round(market.yesPrice * 100);
  const noPct = Math.round(market.noPrice * 100);

  return (
    <header className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="flex flex-wrap items-start gap-4">
        <img
          src={market.avatar ?? dicebear(market.handle)}
          alt={market.student}
          className="h-14 w-14 shrink-0 rounded-2xl object-cover bg-surface shadow-glow"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = dicebear(market.handle); }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
              {market.category}
            </span>
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                market.status === 'resolved' || market.status === 'cancelled'
                  ? 'border-muted-foreground/30 bg-surface text-muted-foreground'
                  : 'border-success/30 bg-success/10 text-success',
              )}
            >
              {market.status === 'live' ? '● Live'
                : market.status === 'closing' ? '● Closing'
                : market.status === 'new' ? '● New'
                : market.status === 'cancelled' ? 'Cancelled'
                : 'Resolved'}
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Will <span className="text-brand">@{market.handle}</span> score 100 on{' '}
            {market.project.split(' — ')[0]}?
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>42 Luanda</span>
            <span className="text-border">•</span>
            <span>{market.category}</span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Closes {formatDate(market.closes)}
            </span>
          </p>
        </div>

      
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-success/80">Yes</span>
          <span className="font-display text-2xl font-bold text-success">{yesPct}%</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-destructive/80">No</span>
          <span className="font-display text-2xl font-bold text-destructive">{noPct}%</span>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
      {children}
    </button>
  );
}

/* ─── ChartCard ──────────────────────────────────────── */

function ChartCard({
  data,
  range,
  setRange,
  market,
}: {
  data: ChartPoint[];
  range: Range;
  setRange: (r: Range) => void;
  market: MarketDto;
}) {
  const yesPct = Math.round(market.yesPrice * 100);
  const noPct = Math.round(market.noPrice * 100);

  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Legend color="oklch(0.78 0.20 150)" label="Yes" value={`${yesPct}%`} />
          <Legend color="oklch(0.68 0.22 18)" label="No" value={`${noPct}%`} />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
                range === r
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="yesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.20 150)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.78 0.20 150)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="noFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.68 0.22 18)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.68 0.22 18)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.4 0.06 270 / 0.18)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="oklch(0.68 0.03 265)"
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              orientation="right"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="oklch(0.68 0.03 265)"
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: 'oklch(0.22 0.05 270 / 0.95)',
                border: '1px solid oklch(0.4 0.06 270 / 0.5)',
                borderRadius: 12,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
              }}
              labelStyle={{ color: 'oklch(0.68 0.03 265)' }}
              formatter={(v: number, n: string) => [`${v}%`, n.toUpperCase()]}
            />
            <Area type="monotone" dataKey="yes" stroke="oklch(0.78 0.20 150)" strokeWidth={2} fill="url(#yesFill)" />
            <Area type="monotone" dataKey="no" stroke="oklch(0.68 0.22 18)" strokeWidth={2} fill="url(#noFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-sm font-semibold">{value}</span>
    </div>
  );
}

/* ─── StatsRow ───────────────────────────────────────── */

function StatsRow({ market }: { market: MarketDto }) {
  const liquidity = (market.volumeRaw + 200).toLocaleString('pt-PT', { minimumFractionDigits: 2 });
  const stats = [
    { label: 'Volume', value: market.volume, suffix: '', icon: BarChart3 },
    { label: 'Liquidity', value: liquidity, suffix: 'xp', icon: Droplets },
    { label: 'Category', value: market.category, suffix: '', icon: Users },
    { label: 'Closes', value: formatDate(market.closes), suffix: '', icon: Clock },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">{s.label}</span>
            <s.icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold truncate">{s.value}</span>
            {s.suffix && <span className="font-mono text-xs text-muted-foreground">{s.suffix}</span>}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─── OutcomesTable ──────────────────────────────────── */

function OutcomesTable({ market }: { market: MarketDto }) {
  const rows = [
    { name: 'Yes', prob: Math.round(market.yesPrice * 100), positive: true },
    { name: 'No', prob: Math.round(market.noPrice * 100), positive: false },
  ];

  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card shadow-card">
      <header className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h2 className="font-display text-lg font-semibold">Outcomes</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Current prices</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              {['Outcome', 'Probability', 'Change', 'Buy Yes', 'Buy No'].map((h) => (
                <th key={h} className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.name} className="border-t border-border/40 transition hover:bg-surface/40">
                <td className="px-5 py-4">
                  <span className={cn('font-display text-base font-semibold', o.positive ? 'text-success' : 'text-destructive')}>
                    {o.name}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono">{o.prob}%</td>
                <td className="px-5 py-4">
                  <span className={cn('inline-flex items-center gap-1 font-mono text-xs', o.positive ? 'text-success' : 'text-destructive')}>
                    {o.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {o.prob}%
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-md border border-success/30 bg-success/10 px-2.5 py-1 font-mono text-xs text-success">
                    {Math.round(market.yesPrice * 100)}%
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-xs text-destructive">
                    {Math.round(market.noPrice * 100)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── RecentActivity ─────────────────────────────────── */

function RecentActivity({ activity }: { activity: ActivityEntry[] }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card shadow-card">
      <header className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live
        </span>
      </header>

      {activity.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">No bets placed yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                {['Time', 'User', 'Action', 'Amount', 'Market'].map((h) => (
                  <th key={h} className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.map((t) => {
                const isYes = t.action.includes('YES');
                return (
                  <tr key={t.id} className="border-t border-border/40 transition hover:bg-surface/40">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{t.time}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={t.avatar ?? dicebear(t.nick)}
                          alt={t.nick}
                          className="h-6 w-6 rounded-full object-cover bg-surface"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = dicebear(t.nick); }}
                        />
                        <span className="font-mono text-xs">@{t.nick}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 font-mono text-[11px]',
                          isYes ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
                        )}
                      >
                        {t.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-semibold">{t.amount}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground truncate max-w-[140px]">{t.market}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ─── TradePanel ─────────────────────────────────────── */

const quickAdds = [1, 5, 10, 50, 100];

function TradePanel({
  market,
  betSide,
  setBetSide,
  amount,
  setAmount,
  shares,
  payout,
}: {
  market: MarketDto;
  betSide: 'YES' | 'NO';
  setBetSide: (s: 'YES' | 'NO') => void;
  amount: number;
  setAmount: (n: number) => void;
  shares: string;
  payout: string;
}) {
  const root = useRouteLoaderData('root') as any;
  const balance: number = root?.data?.wallet?.balance ?? 0;
  const isLoggedIn = !!root?.data;
  const revalidator = useRevalidator();
  const location = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isResolved = market.status === 'resolved';
  const isCancelled = market.status === 'cancelled';
  const isSettled = isResolved || isCancelled;
  const isClosed = new Date(market.closes).getTime() <= Date.now();
  const canBet = isLoggedIn && !isSettled && !isClosed && amount >= 1 && amount <= balance;

  async function handleBet() {
    if (!canBet) return;
    setSubmitting(true);
    setError(null);
    try {
      await marketApi.placeBet(market.id, betSide, amount);
      setSuccess(true);
      revalidator.revalidate();
      setAmount(0);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to place bet. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Trade</h3>
        {isLoggedIn && (
          <span className="font-mono text-[10px] text-muted-foreground">
            Balance: <span className="text-foreground">xp {balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
          </span>
        )}
      </div>

      {/* outcome selector */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setBetSide('YES')}
          disabled={isSettled || isClosed}
          className={cn(
            'rounded-xl border px-3 py-3 text-left transition',
            betSide === 'YES'
              ? 'border-success bg-success/15 shadow-[0_0_24px_oklch(0.78_0.20_150/0.25)]'
              : 'border-success/30 bg-success/5 hover:bg-success/10',
            (isSettled || isClosed) && 'cursor-not-allowed opacity-50',
          )}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-success/80">Yes</div>
          <div className="font-display text-xl font-bold text-success">{Math.round(market.yesPrice * 100)}%</div>
        </button>
        <button
          onClick={() => setBetSide('NO')}
          disabled={isSettled || isClosed}
          className={cn(
            'rounded-xl border px-3 py-3 text-left transition',
            betSide === 'NO'
              ? 'border-destructive bg-destructive/15 shadow-[0_0_24px_oklch(0.68_0.22_18/0.25)]'
              : 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10',
            (isSettled || isClosed) && 'cursor-not-allowed opacity-50',
          )}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-destructive/80">No</div>
          <div className="font-display text-xl font-bold text-destructive">{Math.round(market.noPrice * 100)}%</div>
        </button>
      </div>

      {/* amount */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Amount (xp)</label>
          <span className="font-display text-2xl font-bold tabular-nums">xp {amount > 0 ? amount.toFixed(0) : '0'}</span>
        </div>
        <input
          type="number"
          min={0}
          max={balance}
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="0"
          disabled={isSettled || isClosed || !isLoggedIn}
          className="mt-2 h-11 w-full rounded-xl border border-border/60 bg-surface px-3 font-mono text-base focus:border-primary/60 focus:outline-none disabled:opacity-50"
        />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {quickAdds.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(Math.min(amount + q, Math.floor(balance)))}
              disabled={isSettled || isClosed || !isLoggedIn}
              className="rounded-lg border border-border/60 bg-surface px-1 py-1.5 font-mono text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-40"
            >
              +{q}
            </button>
          ))}
        </div>
      </div>

      {/* estimates */}
      <div className="mt-5 space-y-2 rounded-xl border border-border/40 bg-surface/60 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Shares</span>
          <span className="font-mono tabular-nums">{shares}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-mono tabular-nums">xp {amount > 0 ? amount.toFixed(2) : '0.00'}</span>
        </div>
        <div className="flex justify-between border-t border-border/40 pt-2">
          <span className="text-muted-foreground">Est. max payout</span>
          <span className={cn('font-mono font-semibold tabular-nums', betSide === 'YES' ? 'text-success' : 'text-destructive')}>
            xp {payout}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-center text-xs text-success">
          Bet placed successfully!
        </p>
      )}

      {isResolved ? (
        <div className={cn(
          'mt-4 flex h-12 w-full items-center justify-center rounded-xl border font-semibold text-sm',
          market.resolution === 'YES'
            ? 'border-success/40 bg-success/10 text-success'
            : 'border-destructive/40 bg-destructive/10 text-destructive',
        )}>
          Resolved: {market.resolution}
        </div>
      ) : isCancelled ? (
        <div className="mt-4 flex h-12 w-full items-center justify-center rounded-xl border border-muted-foreground/30 bg-surface text-sm font-semibold text-muted-foreground">
          Cancelled — bets refunded
        </div>
      ) : !isLoggedIn ? (
        <Link
          to="/signin"
          state={{ backgroundLocation: location }}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Sign in to place a bet
        </Link>
      ) : (
        <button
          onClick={handleBet}
          disabled={!canBet || submitting}
          className={cn(
            'mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all',
            betSide === 'YES' ? 'bg-success' : 'bg-destructive',
            canBet && !submitting ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50',
          )}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {submitting ? 'Placing bet…' : `Bet ${betSide} · xp ${amount > 0 ? amount.toFixed(0) : '0'}`}
        </button>
      )}

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        * Max payout assumes you're the only winner on this side.
      </p>
    </section>
  );
}

/* ─── MarketInfoCard ─────────────────────────────────── */

function MarketInfoCard({ market }: { market: MarketDto }) {
  const root = useRouteLoaderData('root') as any;
  // GET /bettor/me nests the account under `.user` — role lives at
  // data.user.role, not data.role.
  const role: string | undefined = root?.data?.user?.role;
  const isAdmin = role === 'admin';
  const revalidator = useRevalidator();

  const [resolveConfirm, setResolveConfirm] = useState(false);
  const [resolving, setResolving] = useState(false);

  async function handleResolve(resolution: 'YES' | 'NO') {
    setResolving(true);
    try {
      await marketApi.resolveMarket(market.id, resolution);
      revalidator.revalidate();
      setResolveConfirm(false);
    } finally {
      setResolving(false);
    }
  }

  const rows = [
    {
      k: 'Creator',
      v: (
        <span className="inline-flex items-center gap-1.5">
          {market.creatorNick ?? 'Admin'} <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        </span>
      ),
    },
    { k: 'Student', v: <span className="font-mono">@{market.handle}</span> },
    { k: 'Market ID', v: <span className="font-mono text-[10px]">{market.id.slice(0, 12)}…</span> },
    { k: 'Category', v: market.category },
  ];

  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card">
      <header className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Market Info</h3>
        <ShieldCheck className="h-4 w-4 text-primary" />
      </header>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((r) => (
          <div key={r.k} className="flex items-start justify-between gap-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">{r.k}</dt>
            <dd className="text-right">{r.v}</dd>
          </div>
        ))}
        <div className="border-t border-border/40 pt-3">
          <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rules</dt>
          <dd className="mt-1 text-sm leading-relaxed text-foreground/80">
            Resolves <span className="font-semibold text-success">"Yes"</span> if{' '}
            <span className="font-mono">@{market.handle}</span> scores 100 on{' '}
            {market.project.split(' — ')[0]}, automatically once 42 publishes the grade.
          </dd>
        </div>
      </dl>

      {/* admin resolve */}
      {isAdmin && market.status !== 'resolved' && market.status !== 'cancelled' && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
          {resolveConfirm ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground">Confirm resolution:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolve('YES')}
                  disabled={resolving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-success/30 bg-success/15 py-2 text-xs font-semibold text-success transition hover:bg-success/25 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> YES
                </button>
                <button
                  onClick={() => handleResolve('NO')}
                  disabled={resolving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/15 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/25 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> NO
                </button>
                <button
                  onClick={() => setResolveConfirm(false)}
                  disabled={resolving}
                  className="rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setResolveConfirm(true)}
              className="flex w-full items-center justify-center gap-2 py-1.5 text-xs font-medium text-primary transition hover:text-primary/80"
            >
              <Shield className="h-3.5 w-3.5" /> Resolve Market
            </button>
          )}
        </div>
      )}
    </section>
  );
}
