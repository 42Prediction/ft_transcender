import { useState } from "react";
import { CheckCircle2, XCircle, Circle } from "lucide-react";

type Outcome = "Won" | "Lost" | "Pending";
type Row = { market:string; cat:string; predicted:string; outcome:Outcome; date:string; pnl:string };

const history: Row[] = [
  { market:"Born2beroot — Pass/Fail",       cat:"Projects",   predicted:"Pass",             outcome:"Won",     date:"Aug 28", pnl:"+₳ 320" },
  { market:"Piscine C — Exam 04",           cat:"Piscine",    predicted:"Score 90–100",     outcome:"Won",     date:"Aug 24", pnl:"+₳ 540" },
  { market:"push_swap — Pass/Fail",         cat:"Projects",   predicted:"Pass",             outcome:"Lost",    date:"Aug 20", pnl:"-₳ 210" },
  { market:"get_next_line — Score 75–89",   cat:"Projects",   predicted:"84",               outcome:"Won",     date:"Aug 15", pnl:"+₳ 190" },
  { market:"Common Core — Peer Eval",       cat:"Peer Evals", predicted:"Pass/Fail → Pass", outcome:"Won",     date:"Aug 11", pnl:"+₳ 280" },
  { market:"Philosophers — Score 90–100",   cat:"Projects",   predicted:"95",               outcome:"Lost",    date:"Aug 06", pnl:"-₳ 260" },
  { market:"libft — Pass/Fail",             cat:"Piscine",    predicted:"Pending",          outcome:"Pending", date:"Aug 02", pnl:"₳ 0"   },
];

function OutcomePill({ outcome }: { outcome: Outcome }) {
  const map = {
    Won:     { Icon: CheckCircle2, cls: "bg-[color:var(--yes)]/15 text-[color:var(--yes)]" },
    Lost:    { Icon: XCircle,      cls: "bg-[color:var(--no)]/15 text-[color:var(--no)]"   },
    Pending: { Icon: Circle,       cls: "bg-accent/15 text-accent"                         },
  } as const;
  const { Icon, cls } = map[outcome];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {outcome}
    </span>
  );
}

export function HistoryTable() {
  const [filter, setFilter] = useState<"All" | Outcome>("All");
  const rows = history.filter((r) => filter === "All" || r.outcome === filter);

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Prediction History</h3>
          <p className="text-xs text-muted-foreground">Resolved markets across all categories</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-surface p-1 text-xs">
          {(["All","Won","Lost","Pending"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 transition ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Market","Category","Predicted","Outcome","Date"].map((h) => (
                <th key={h} className="pb-2 font-medium pr-4">{h}</th>
              ))}
              <th className="pb-2 font-medium text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/40 last:border-0 transition hover:bg-surface/40">
                <td className="py-3 font-medium pr-4">{r.market}</td>
                <td className="py-3 text-muted-foreground pr-4">{r.cat}</td>
                <td className="py-3 font-mono text-xs text-muted-foreground pr-4">{r.predicted}</td>
                <td className="py-3 pr-4"><OutcomePill outcome={r.outcome} /></td>
                <td className="py-3 text-muted-foreground pr-4">{r.date}</td>
                <td className={`py-3 text-right font-mono font-semibold ${r.pnl.startsWith("+") ? "text-[color:var(--yes)]" : r.pnl.startsWith("-") ? "text-[color:var(--no)]" : "text-muted-foreground"}`}>
                  {r.pnl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}