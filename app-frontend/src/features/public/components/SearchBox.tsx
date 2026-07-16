import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marketApi, type GlobalSearchResults } from "@/api/market/market.api";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

type ResultItem =
  | { kind: "market"; id: string; label: string; sub: string | null; avatar: string | null; status: string }
  | { kind: "bettor"; nick: string; avatar: string | null; campus: string | null };

function avatarFor(seed: string, avatar: string | null) {
  return avatar || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
}

export function SearchBox({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const items: ResultItem[] = useMemo(() => {
    if (!results) return [];
    return [
      ...results.markets.map((m): ResultItem => ({
        kind: "market",
        id: m.id,
        label: m.project,
        sub: m.subjectLogin,
        avatar: m.subjectAvatar,
        status: m.status,
      })),
      ...results.bettors.map((b): ResultItem => ({
        kind: "bettor",
        nick: b.nick,
        avatar: b.avatar,
        campus: b.campus,
      })),
    ];
  }, [results]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await marketApi.search(q);
        if (!cancelled) {
          setResults(data);
          setActiveIndex(-1);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setResults(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const goTo = (item: ResultItem) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    inputRef.current?.blur();
    if (item.kind === "market") navigate(`/market/${item.id}`);
    else navigate(`/user/${item.nick}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      goTo(items[activeIndex]);
    }
  };

  const showPanel = open && query.trim().length >= MIN_QUERY_LENGTH;
  const marketsCount = results?.markets.length ?? 0;

  return (
    <div ref={containerRef} className={`relative min-w-0 flex-1 lg:w-80 lg:flex-initial ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        name="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim().length >= MIN_QUERY_LENGTH) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search students, projects, exams…"
        autoComplete="off"
        className="h-10 w-full rounded-xl border border-border/60 bg-surface pl-10 pr-12 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
      />
      <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:block">⌘K</kbd>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border/60 bg-background p-1.5 shadow-xl backdrop-blur-xl">
          {loading && items.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">Searching…</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No markets or users found.
            </div>
          ) : (
            <>
              {marketsCount > 0 && (
                <div className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Markets
                </div>
              )}
              {items.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <div key={item.kind === "market" ? `m-${item.id}` : `b-${item.nick}`}>
                    {item.kind === "bettor" && index === marketsCount && (
                      <div className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Users
                      </div>
                    )}
                    <button
                      onClick={() => goTo(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active ? "bg-surface text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <img
                        src={avatarFor(
                          item.kind === "market" ? (item.sub ?? item.id) : item.nick,
                          item.avatar,
                        )}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-lg object-cover"
                      />
                      {item.kind === "market" ? (
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground">{item.label}</div>
                          <div className="truncate font-mono text-[11px] text-muted-foreground">
                            {item.sub ? `@${item.sub}` : "—"}
                            <span className="ml-2 uppercase">{item.status}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground">@{item.nick}</div>
                          {item.campus && (
                            <div className="truncate font-mono text-[11px] text-muted-foreground">
                              {item.campus}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
