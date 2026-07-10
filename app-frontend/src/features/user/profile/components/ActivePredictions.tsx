import { Clock } from "lucide-react";
import { SectionTitle } from "./SectionTitle";

const predictions = [
  { title:"ft_transcendence — Final Eval", range:"Outcome: Pass",  time:"2d 14h",  conf:85, prob:78, stake:"₳ 450", live:4 },
  { title:"Piscine C — Exam 02",           range:"Score 90–100",   time:"18h 02m", conf:60, prob:41, stake:"₳ 220", live:7 },
  { title:"Inception — Peer Review",       range:"Outcome: Pass",  time:"3d 06h",  conf:92, prob:88, stake:"₳ 600", live:2 },
  { title:"minishell — Defense",           range:"Score 75–89",    time:"5d 09h",  conf:45, prob:52, stake:"₳ 180", live:3 },
];

function Bar({ label, value, tone }: { label:string; value:number; tone:"primary"|"accent" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div className={`h-full rounded-full ${tone === "primary" ? "bg-gradient-brand" : "bg-accent"}`}
          style={{ width:`${value}%` }} />
      </div>
    </div>
  );
}

function Card({ p }: { p: typeof predictions[number] }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card transition hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.range}</div>
          <h4 className="mt-1 font-display font-semibold leading-tight">{p.title}</h4>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[color:var(--yes)]/15 px-2 py-0.5 text-[10px] font-medium text-[color:var(--yes)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--yes)]" /> {p.live} live
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <Bar label="Your confidence"    value={p.conf} tone="primary" />
        <Bar label="Market probability" value={p.prob} tone="accent"  />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {p.time}</span>
        <span className="font-mono font-semibold text-primary">{p.stake}</span>
      </div>
    </div>
  );
}

export function ActivePredictions() {
  return (
    <section>
      <SectionTitle
        title="Active Predictions"
        subtitle="Live markets you currently hold positions on"
        badge={`${predictions.length} open`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {predictions.map((p) => <Card key={p.title} p={p} />)}
      </div>
    </section>
  );
}