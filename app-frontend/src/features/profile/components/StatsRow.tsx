import { Target, TrendingUp, Shield, Activity, Trophy, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

const metrics = [
  { label: "Accuracy",          value: "73.4%",     trend: "+2.1%",    up: true, Icon: Target    },
  { label: "Net P&L",           value: "+₳ 12.5k",  trend: "+6.2%",    up: true, Icon: TrendingUp },
  { label: "Reputation",        value: "8,420",      trend: "+184",     up: true, Icon: Shield    },
  { label: "Total Predictions", value: "486",         trend: "9 live",  up: true, Icon: Activity  },
  { label: "Win / Loss",        value: "318 / 132",   trend: "2.4 ratio",up:true, Icon: Trophy    },
  { label: "ROI Index",         value: "1.92×",       trend: "+0.14",   up: true, Icon: Sparkles  },
];

export function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map(({ label, value, trend, up, Icon }) => (
        <div key={label} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card transition hover:border-primary/40">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
          <div className="flex items-center justify-between">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${up ? "bg-[color:var(--yes)]/15 text-[color:var(--yes)]" : "bg-[color:var(--no)]/15 text-[color:var(--no)]"}`}>
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </span>
          </div>
          <div className="mt-3 font-mono text-xl font-bold tracking-tight">{value}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}