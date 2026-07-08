import { useState } from 'react';
import { ArrowRight, Check, Shield, X } from 'lucide-react';
import { Link, useNavigate, useRevalidator, useRouteLoaderData } from 'react-router-dom';
import type { MarketDto } from '@/api/market/market.api';
import { marketApi } from '@/api/market/market.api';

const statusLabel: Record<MarketDto['status'], string> = {
  live: 'Featured · Live',
  closing: 'Closing soon',
  new: 'New market',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

function timeUntil(closes: string): string {
  const diff = new Date(closes).getTime() - Date.now();
  if (diff <= 0) return 'Closed';
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  const rem = h % 24;
  return rem > 0 ? `${d}d ${rem}h` : `${d}d`;
}

function avatarFallback(name: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`;
}

export function MarketCard({ m, onRefresh }: { m: MarketDto; onRefresh?: () => void }) {
  const root = useRouteLoaderData('root') as any;
  // GET /bettor/me nests the account under `.user` — role lives at
  // data.user.role, not data.role.
  const role: string | undefined = root?.data?.user?.role;
  const isLoggedIn = !!root?.data;
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const [resolveConfirm, setResolveConfirm] = useState(false);
  const [resolving, setResolving] = useState(false);

  const yesPct = Math.round(m.yesPrice * 100);
  const noPct = Math.round(m.noPrice * 100);
  const avatarSrc = m.avatar ?? avatarFallback(m.handle);
  const isSettled = m.status === 'resolved' || m.status === 'cancelled';
  const canBet = !isSettled && new Date(m.closes).getTime() > Date.now();
  const isAdmin = role === 'admin';
  const canResolve = isAdmin && !isSettled;

  function openBet(side: 'YES' | 'NO') {
    navigate(`/market/${m.id}?side=${side}`);
  }

  async function handleResolve(resolution: 'YES' | 'NO') {
    setResolving(true);
    try {
      await marketApi.resolveMarket(m.id, resolution);
      revalidator.revalidate();
      onRefresh?.();
      setResolveConfirm(false);
    } catch {
      // silent — server error is non-critical for UX here
    } finally {
      setResolving(false);
    }
  }

  return (
    <>
      <article className="group relative flex flex-col gap-5 rounded-3xl border border-border/60 bg-gradient-card p-6 shadow-card transition hover:border-primary/40 hover:shadow-glow">
        <header className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 font-mono uppercase tracking-wider text-success">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
            {statusLabel[m.status]}
          </span>
          <span className="font-mono uppercase tracking-wider text-muted-foreground">
            Closes in {timeUntil(m.closes)}
          </span>
        </header>

        <div className="flex items-start gap-3">
          <img
            src={avatarSrc}
            alt={m.student}
            className="h-11 w-11 shrink-0 rounded-xl bg-gradient-brand object-cover shadow-glow"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = avatarFallback(m.handle);
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {m.category}
            </p>
            <h3 className="mt-1 font-display text-lg font-bold leading-snug text-foreground">
              Will <span className="text-primary">@{m.handle}</span> score 100 on{' '}
              {m.project.split(' — ')[0]}?
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {m.category} · Cohort 2025
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Probability</span>
            <span className="font-mono font-semibold text-success">{yesPct}% YES</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-success shadow-[0_0_12px_hsl(var(--success)/0.6)]"
              style={{ width: `${yesPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => canBet && openBet('YES')}
            disabled={!canBet}
            className="flex flex-col items-start gap-1 rounded-2xl border border-success/30 bg-success/10 p-4 text-left transition hover:bg-success/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-success/80">YES</span>
            <span className="font-display text-2xl font-bold text-success">{yesPct}%</span>
          </button>
          <button
            onClick={() => canBet && openBet('NO')}
            disabled={!canBet}
            className="flex flex-col items-start gap-1 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-left transition hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-destructive/80">NO</span>
            <span className="font-display text-2xl font-bold text-destructive">{noPct}%</span>
          </button>
        </div>

        {/* Admin resolve section */}
        {canResolve && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            {resolveConfirm ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Confirm resolution:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve('YES')}
                    disabled={resolving}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success/15 border border-success/30 py-2 text-xs font-semibold text-success transition hover:bg-success/25 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    YES
                  </button>
                  <button
                    onClick={() => handleResolve('NO')}
                    disabled={resolving}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive/15 border border-destructive/30 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/25 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    NO
                  </button>
                  <button
                    onClick={() => setResolveConfirm(false)}
                    disabled={resolving}
                    className="rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
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
                <Shield className="h-3.5 w-3.5" />
                Resolve Market
              </button>
            )}
          </div>
        )}

        {m.status === 'resolved' && m.resolution && (
          <div className={`rounded-xl border p-3 text-center text-sm font-semibold ${m.resolution === 'YES' ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
            Resolved: {m.resolution}
          </div>
        )}

        {m.status === 'cancelled' && (
          <div className="rounded-xl border border-muted-foreground/30 bg-surface p-3 text-center text-sm font-semibold text-muted-foreground">
            Cancelled — bets refunded
          </div>
        )}

        <footer className="flex items-center justify-between border-t border-border/50 pt-4 text-xs">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>
              Vol <span className="font-mono font-semibold text-foreground">{m.volume}</span>
            </span>
          </div>
          <Link
            to={`/market/${m.id}`}
            className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider text-success transition hover:gap-2.5"
          >
            View market <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </article>
    </>
  );
}
