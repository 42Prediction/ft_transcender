import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLoaderData, useRouteLoaderData } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { MarketCard } from '../components/MarketCard';
import type { CategoryStat, MarketDto } from '@/api/market/market.api';
import { marketApi } from '@/api/market/market.api';
import { CreateMarketModal } from '@/features/market/components/CreateMarketModal';
import { useMarketUpdates } from '@/features/market/hooks/useMarketUpdates';

type SortKey = 'volume' | 'closing' | 'probability';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'volume', label: 'Volume' },
  { value: 'closing', label: 'Closing soon' },
  { value: 'probability', label: 'Highest probability' },
];

const PAGE_SIZE = 12;

function sortMarkets(list: MarketDto[], sortBy: SortKey): MarketDto[] {
  const copy = [...list];
  switch (sortBy) {
    case 'closing':
      return copy.sort((a, b) => new Date(a.closes).getTime() - new Date(b.closes).getTime());
    case 'probability':
      return copy.sort((a, b) => b.probability - a.probability);
    case 'volume':
    default:
      return copy.sort((a, b) => b.volumeRaw - a.volumeRaw);
  }
}

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
  const { markets: initial, categories: initialCategories } =
    (useLoaderData() as MarketsLoaderData | undefined) ?? { markets: [], categories: [] };
  const root = useRouteLoaderData('root') as any;
  const isAdmin = root?.data?.user?.role === 'admin';
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [markets, setMarkets] = useState<MarketDto[]>(initial);
  const [categories, setCategories] = useState<CategoryStat[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('volume');
  const [page, setPage] = useState(1);

  function refreshCategoryCounts() {
    marketApi.getCategories().then(setCategories).catch(() => {});
  }

  async function applyFilters(category: string, q: string, closed: boolean) {
    setLoading(true);
    try {
      const data = await marketApi.getAll({
        category: category !== 'All' ? category : undefined,
        search: q || undefined,
        status: closed ? 'closed' : undefined,
      });
      setMarkets(data);
    } finally {
      setLoading(false);
    }
  }

  function handleCategory(cat: string) {
    setActiveCategory(cat);
    setPage(1);
    applyFilters(cat, search, showClosed);
  }

  function handleSearch(q: string) {
    setSearch(q);
    setPage(1);
    applyFilters(activeCategory, q, showClosed);
  }

  function handleShowClosed(closed: boolean) {
    setShowClosed(closed);
    setPage(1);
    applyFilters(activeCategory, search, closed);
  }

  function handleSort(next: SortKey) {
    setSortBy(next);
    setPage(1);
  }

  async function refreshMarkets() {
    const data = await marketApi.getAll({
      category: activeCategory !== 'All' ? activeCategory : undefined,
      search: search || undefined,
      status: showClosed ? 'closed' : undefined,
    });
    setMarkets(data);
  }

  const filtersRef = useRef({ activeCategory, search, showClosed });
  useEffect(() => {
    filtersRef.current = { activeCategory, search, showClosed };
  }, [activeCategory, search, showClosed]);

  function matchesFilters(m: MarketDto): boolean {
    const { activeCategory: category, search: q, showClosed: closed } = filtersRef.current;
    const isClosed = m.status === 'resolved' || m.status === 'cancelled'
      || new Date(m.closes).getTime() <= Date.now();
    if (isClosed !== closed) return false;
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
        if (!exists) return prev;
        refreshCategoryCounts();
        return prev.filter((m) => m.id !== updated.id);
      }
      if (!exists) refreshCategoryCounts();
      return exists
        ? prev.map((m) => (m.id === updated.id ? updated : m))
        : [updated, ...prev];
    });
  }, []);

  const handleMarketRemove = useCallback((marketId: string) => {
    setMarkets((prev) => {
      if (!prev.some((m) => m.id === marketId)) return prev;
      refreshCategoryCounts();
      return prev.filter((m) => m.id !== marketId);
    });
  }, []);

  useMarketUpdates(handleMarketUpdate, handleMarketRemove);

  const sortedMarkets = useMemo(() => sortMarkets(markets, sortBy), [markets, sortBy]);
  const totalPages = Math.max(1, Math.ceil(sortedMarkets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedMarkets = sortedMarkets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">All Markets</h1>
          <p className="mt-2 text-muted-foreground">
            Auto-generated from upcoming 42 Luanda exams — bet on who scores 100.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Market (override)
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
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value as SortKey)}
          className="h-10 rounded-xl border border-border/60 bg-surface px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-1 rounded-xl border border-border/60 bg-surface p-1">
          <button
            onClick={() => handleShowClosed(false)}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
              !showClosed
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => handleShowClosed(true)}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
              showClosed
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Closed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : sortedMarkets.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border/40 bg-surface text-muted-foreground">
          No markets found.
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pagedMarkets.map((m) => (
              <MarketCard key={m.id} m={m} onRefresh={refreshMarkets} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:text-primary disabled:opacity-40 disabled:hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:text-primary disabled:opacity-40 disabled:hover:text-foreground"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
