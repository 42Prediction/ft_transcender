import { Trophy } from "lucide-react";
import { SectionTitle } from "./SectionTitle";

const data = [
  { market:"Piscine C — Exam 04",   pnl:"+₳ 540", acc:"98%" },
  { market:"Common Core Peer Eval", pnl:"+₳ 280", acc:"94%" },
  { market:"Born2beroot Pass",      pnl:"+₳ 320", acc:"91%" },
  { market:"get_next_line 84",      pnl:"+₳ 190", acc:"88%" },
];

export function TopPerformances() {
  return (
    <section>
      <SectionTitle title="Top Performances" subtitle="Your best predictions of all time" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {data.map((t, i) => (
          <div key={t.market} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card transition hover:border-primary/40">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand font-mono text-xs font-bold text-primary-foreground shadow-glow">
                #{i + 1}
              </span>
              <Trophy className="h-4 w-4 text-[color:var(--warning)]" />
            </div>
            <h4 className="mt-3 font-display font-semibold leading-tight">{t.market}</h4>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Realized P&L</div>
                <div className="font-mono text-lg font-bold text-[color:var(--yes)]">{t.pnl}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</div>
                <div className="font-mono text-sm font-semibold">{t.acc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}