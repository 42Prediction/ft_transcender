import { ArrowRight } from "lucide-react";
import type { Market } from "./mock/data";
import { Link } from "react-router-dom";


const statusLabel: Record<Market["status"], string> = {
  live: "Featured · Live",
  closing: "Closing soon",
  new: "New market",
};

export function MarketCard({ m }: { m: Market }) {
  const yesPct = Math.round(m.yesPrice * 100);
  const noPct = Math.round(m.noPrice * 100);
  const initials = m.student
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toLowerCase();

  return (
    <article className="group relative flex flex-col gap-5 rounded-3xl border border-border/60 bg-gradient-card p-6 shadow-card transition hover:border-primary/40 hover:shadow-glow">
      <header className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 font-mono uppercase tracking-wider text-success">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
          {statusLabel[m.status]}
        </span>
        <span className="font-mono uppercase tracking-wider text-muted-foreground">
          Closes in {m.closes}
        </span>
      </header>

      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand font-mono text-sm font-bold text-primary-foreground shadow-glow">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {m.category} defense
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-foreground">
            Will <span className="text-primary">@{m.handle}</span> pass {m.project.split(" — ")[0]} on first defense?
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {m.category} · Cohort 2025 · 142 participants
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
        <button className="flex flex-col items-start gap-1 rounded-2xl border border-success/30 bg-success/10 p-4 text-left transition hover:bg-success/15">
          <span className="font-mono text-[10px] uppercase tracking-wider text-success/80">YES</span>
          <span className="font-display text-2xl font-bold text-success">{yesPct}¢</span>
        </button>
        <button className="flex flex-col items-start gap-1 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-left transition hover:bg-destructive/15">
          <span className="font-mono text-[10px] uppercase tracking-wider text-destructive/80">NO</span>
          <span className="font-display text-2xl font-bold text-destructive">{noPct}¢</span>
        </button>
      </div>

      <footer className="flex items-center justify-between border-t border-border/50 pt-4 text-xs">
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>Vol <span className="font-mono font-semibold text-foreground">{m.volume}</span></span>
          <span>Liquidity <span className="font-mono font-semibold text-foreground">₳ 62k</span></span>
        </div>
        <Link
          to="/market/$id"
          className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider text-success transition hover:gap-2.5"
        >
          View market <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </footer>
    </article>
  );
}
