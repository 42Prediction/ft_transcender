import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const data = [
  { name: "Won",     value: 318, color: "var(--yes)"    },
  { name: "Lost",    value: 132, color: "var(--no)"     },
  { name: "Pending", value: 36,  color: "var(--accent)" },
];
const total = data.reduce((s, x) => s + x.value, 0);

export function WinLossChart() {
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold">Win / Loss Ratio</h3>
      <p className="text-xs text-muted-foreground">Career resolution breakdown</p>
      <div className="relative mt-2 h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80}
              stroke="oklch(0.16 0.04 270)" strokeWidth={3} paddingAngle={2}>
              {data.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-mono text-2xl font-bold">{Math.round((318 / total) * 100)}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {data.map((w) => (
          <div key={w.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: w.color }} /> {w.name}
            </span>
            <span className="font-mono">{w.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}