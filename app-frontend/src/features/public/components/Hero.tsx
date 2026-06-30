import { ArrowRight, TrendingUp, Users, Zap } from 'lucide-react';
import { MarketCard } from './MarketCard';
import { useRouteLoaderData } from 'react-router-dom';
import type { MarketDto, PlatformStats } from '@/api/market/market.api';

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `₳ ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₳ ${(v / 1_000).toFixed(1)}K`;
  return `₳ ${v.toFixed(0)}`;
}

export function Hero() {
  const data = useRouteLoaderData('home') as {
    trending: MarketDto[];
    stats: PlatformStats;
  } | null;

  const featured = data?.trending?.[0] ?? null;
  const stats = data?.stats;

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28">
        <div className="flex flex-col justify-center">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary" />
            Live • {stats?.activeBettors?.toLocaleString('pt-PT') ?? '—'} traders online
          </span>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Predict the next <br />
            <span className="text-brand">42 success evaluation.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            42 Prediction is the community prediction market for 42 students. Trade on peer
            evaluations, project defenses, exam outcomes and milestones, backed by real
            performance data from the 42 ecosystem.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="group inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-80">
              Start predicting
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface px-6 py-3.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated">
              Explore markets
            </button>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border/50 pt-8">
            {[
              {
                icon: TrendingUp,
                label: 'Volume (30d)',
                value: stats ? formatVolume(stats.volume30d) : '—',
              },
              {
                icon: Users,
                label: 'Active traders',
                value: stats?.activeBettors?.toLocaleString('pt-PT') ?? '—',
              },
              {
                icon: Zap,
                label: 'Live markets',
                value: stats?.liveMarkets?.toLocaleString('pt-PT') ?? '—',
              },
            ].map((s) => (
              <div key={s.label}>
                <s.icon className="mb-2 h-4 w-4 text-primary" />
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-md">
            {featured ? (
              <MarketCard m={featured} />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-3xl border border-border/60 bg-gradient-card text-muted-foreground">
                No featured market yet
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
