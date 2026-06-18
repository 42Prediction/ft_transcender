import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { m: "Nov", acc: 61, roi: 1.3  }, { m: "Dec", acc: 64, roi: 1.4  },
  { m: "Jan", acc: 66, roi: 1.5  }, { m: "Feb", acc: 65, roi: 1.55 },
  { m: "Mar", acc: 69, roi: 1.62 }, { m: "Apr", acc: 71, roi: 1.74 },
  { m: "May", acc: 72, roi: 1.81 }, { m: "Jun", acc: 73.4,roi: 1.92},
];

export function AccuracyChart() {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Accuracy & ROI Trend</h3>
          <p className="text-xs text-muted-foreground">8-month rolling performance</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-surface p-1 text-xs">
          {["3M","6M","1Y","ALL"].map((r, i) => (
            <button key={r} className={`rounded-md px-2 py-1 ${i === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top:5, right:5, left:-20, bottom:0 }}>
            <defs>
              <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="oklch(0.88 0.22 130)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.88 0.22 130)" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gRoi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="oklch(0.78 0.16 210)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.78 0.16 210)" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0.06 270 / 0.15)" />
            <XAxis dataKey="m" stroke="oklch(0.68 0.03 265)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.68 0.03 265)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background:"oklch(0.22 0.05 270 / 0.95)", border:"1px solid oklch(0.4 0.06 270 / 0.4)", borderRadius:12, fontSize:12 }} />
            <Area type="monotone" dataKey="acc" stroke="oklch(0.88 0.22 130)" strokeWidth={2.5} fill="url(#gAcc)" />
            <Area type="monotone" dataKey="roi" stroke="oklch(0.78 0.16 210)" strokeWidth={2}   fill="url(#gRoi)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Accuracy %</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent"   /> ROI Index</span>
      </div>
    </div>
  );
}