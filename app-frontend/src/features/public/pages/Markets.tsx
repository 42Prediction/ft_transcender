import { useCallback, useEffect, useRef, useState } from 'react';
import { useLoaderData, useRouteLoaderData } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { MarketCard } from '../components/MarketCard';
import type { CategoryStat, MarketDto } from '@/api/market/market.api';
import { marketApi } from '@/api/market/market.api';
import { CreateMarketModal } from '@/features/market/components/CreateMarketModal';
import { useMarketUpdates } from '@/features/market/hooks/useMarketUpdates';

export interface MarketsLoaderData {
  markets: MarketDto[];
  categories: CategoryStat[];
}

export async function marketsLoader(): Promise<MarketsLoaderData> {
  try {
    const [markets, categories] = await Promise.all([
      marketApi.getAll(),
      marketApi.getCategories(),
    ]);
    return { markets, categories };
  } catch {
    return { markets: [], categories: [] };
  }
}

export function Markets() {
  const { markets: initial, categories } = useLoaderData() as MarketsLoaderData;
  const root = useRouteLoaderData('root') as any;
  const isLoggedIn = !!root?.data;
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [markets, setMarkets] = useState<MarketDto[]>(initial);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  async function applyFilters(category: string, q: string) {
    setLoading(true);
    try {
      const data = await marketApi.getAll({
        category: category !== 'All' ? category : undefined,
        search: q || undefined,
      });
      setMarkets(data);
    } finally {
      setLoading(false);
    }
  }

  function handleCategory(cat: string) {
    setActiveCategory(cat);
    applyFilters(cat, search);
  }

  function handleSearch(q: string) {
    setSearch(q);
    applyFilters(activeCategory, q);
  }

  async function refreshMarkets() {
    const data = await marketApi.getAll({
      category: activeCategory !== 'All' ? activeCategory : undefined,
      search: search || undefined,
    });
    setMarkets(data);
  }

  // Keep the currently active filters available to the socket handlers below
  // without re-subscribing on every keystroke/category change.
  const filtersRef = useRef({ activeCategory, search });
  useEffect(() => {
    filtersRef.current = { activeCategory, search };
  }, [activeCategory, search]);

  function matchesFilters(m: MarketDto): boolean {
    const { activeCategory: category, search: q } = filtersRef.current;
    if (m.status === 'resolved') return false;
    if (category !== 'All' && m.category !== category) return false;
    if (q) {
      const needle = q.toLowerCase();
      const haystack = `${m.student} ${m.handle} ${m.project}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }

  const handleMarketUpdate = useCallback((updated: MarketDto) => {
    setMarkets((prev) => {
      const exists = prev.some((m) => m.id === updated.id);
      if (!matchesFilters(updated)) {
        return exists ? prev.filter((m) => m.id !== updated.id) : prev;
      }
      return exists
        ? prev.map((m) => (m.id === updated.id ? updated : m))
        : [updated, ...prev];
    });
  }, []);

  const handleMarketRemove = useCallback((marketId: string) => {
    setMarkets((prev) => prev.filter((m) => m.id !== marketId));
  }, []);

  useMarketUpdates(handleMarketUpdate, handleMarketRemove);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">All Markets</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and trade on 42 student outcomes.
          </p>
        </div>
        {isLoggedIn && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Market
          </button>
        )}
      </div>

      <CreateMarketModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refreshMarkets}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search markets…"
            className="h-10 w-full rounded-xl border border-border/60 bg-surface pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => handleCategory(c.name)}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                activeCategory === c.name
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-surface text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.name}
              <span className="ml-1.5 font-mono text-xs opacity-60">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : markets.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border/40 bg-surface text-muted-foreground">
          No markets found.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((m) => (
            <MarketCard key={m.id} m={m} onRefresh={refreshMarkets} />
          ))}
        </div>
      )}
    </div>
  );
}
