import { ArrowUpRight, Flame } from "lucide-react";
import { MarketCard } from "./MarketCard";
import { trending } from "./mock/data";

export function Trending() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-warning">
            <Flame className="h-3 w-3" /> Trending now
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold">Hottest predictions this week</h2>
          <p className="mt-2 text-muted-foreground">Highest-volume markets across the 42 network.</p>
        </div>
        <a href="#" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          View all <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {trending.slice(0, 3).map((m) => <MarketCard key={m.id} m={m} />)}
      </div>
    </section>
  );
}