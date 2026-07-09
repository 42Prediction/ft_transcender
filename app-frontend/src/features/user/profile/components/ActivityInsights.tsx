import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { marketApi, type MyActivityData } from "@/api/market/market.api";

export function ActivityInsights() {
  const [data, setData] = useState<MyActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketApi
      .getMyActivity()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">My Activity</h3>
        <div className="mt-4 h-32 animate-pulse rounded-lg bg-surface/60" />
      </div>
    );
  }

  if (!data || data.series.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">My Activity</h3>
        <p className="mt-1 text-xs text-muted-foreground">Last 30 days</p>
        <div className="mt-4 grid h-32 place-items-center text-sm text-muted-foreground">
          No bets in the last 30 days.
        </div>
      </div>
    );
  }

  const netPnl = data.totals.payout - data.totals.wagered;
  const topCategory = data.categories[0]?.category ?? "—";

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold">My Activity</h3>
      <p className="text-xs text-muted-foreground">Last 30 days</p>

      <div className="mt-3 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.series}>
            <defs>
              <linearGradient id="myActivityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                background: "color-mix(in oklch, var(--background) 85%, transparent)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(v: any) => [`xp ${Number(v).toFixed(0)}`, "Wagered"]}
            />
            <Area
              type="monotone"
              dataKey="wagered"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#myActivityFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="font-mono text-sm font-semibold text-foreground">
            xp {data.totals.wagered.toFixed(0)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Wagered</p>
        </div>
        <div>
          <p
            className={`font-mono text-sm font-semibold ${netPnl >= 0 ? "text-success" : "text-destructive"}`}
          >
            {netPnl >= 0 ? "+" : ""}
            {netPnl.toFixed(0)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net P&L</p>
        </div>
        <div>
          <p className="truncate font-mono text-sm font-semibold text-foreground" title={topCategory}>
            {topCategory}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top category</p>
        </div>
      </div>
    </div>
  );
}
