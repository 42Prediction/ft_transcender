import { ArrowUpRight, Flame } from 'lucide-react';
import { MarketCard } from './MarketCard';
import { Link, useRouteLoaderData } from 'react-router-dom';
import type { MarketDto } from '@/api/market/market.api';

export function Trending() {
  const data = useRouteLoaderData('home') as { trending: MarketDto[] } | null;
  const trending = data?.trending ?? [];

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-warning">
            <Flame className="h-3 w-3" /> Trending now
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold">
            Hottest predictions this week
          </h2>
          <p className="mt-2 text-muted-foreground">
            Highest-volume markets across the 42 network.
          </p>
        </div>
        <Link
          to="/markets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View all <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {trending.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-border/40 bg-surface text-muted-foreground">
          No markets yet. Be the first to create one!
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trending.slice(0, 3).map((m) => (
            <MarketCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </section>
  );
}
