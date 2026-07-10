import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ShieldCheck,
  Clock,
  Users,
  Droplets,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/exambet/Navbar";
import { Footer } from "@/components/exambet/Sections";
import { markets } from "@/components/exambet/data";

export const Route = createFileRoute("/market/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Will JohnDoe pass the CPP Module Exam? — ExamBet` },
      {
        name: "description",
        content:
          "Trade Yes / No on this 42 School prediction market. Live probabilities, order book, recent trades and full market rules.",
      },
      { property: "og:title", content: `ExamBet · Market #${params.id}` },
    ],
  }),
  component: MarketPage,
});

/* ---------- mock data ---------- */

const RANGES = ["1H", "6H", "1D", "1W", "1M", "ALL"] as const;
type Range = (typeof RANGES)[number];

function genSeries(seed: number, points: number, base: number, vol: number) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  return Array.from({ length: points }, (_, i) => {
    base += (rand() - 0.5) * vol;
    base = Math.max(5, Math.min(95, base));
    const yes = base;
    return {
      t: months[Math.floor((i / points) * months.length)] + " " + (i + 1),
      label: months[Math.floor((i / points) * months.length)],
      yes: Math.round(yes),
      no: Math.round(100 - yes),
    };
  });
}

const outcomes = [
  {
    name: "Yes",
    prob: 79,
    change: 6,
    buy: 79,
    sell: 21,
    volume: "$18,345.20",
    positive: true,
  },
  {
    name: "No",
    prob: 21,
    change: -6,
    buy: 79,
    sell: 21,
    volume: "$5,113.22",
    positive: false,
  },
];

const recentTrades = [
  { time: "2m ago", user: "@42Hacker", action: "Bought", outcome: "Yes", price: "79¢", amount: 50, total: "$39.50" },
  { time: "5m ago", user: "@peerPredictor", action: "Bought", outcome: "No", price: "21¢", amount: 100, total: "$21.00" },
  { time: "8m ago", user: "@CoreWarrior", action: "Sold", outcome: "Yes", price: "78¢", amount: 25, total: "$19.50" },
  { time: "12m ago", user: "@piscineKing", action: "Bought", outcome: "Yes", price: "80¢", amount: 10, total: "$8.00" },
  { time: "17m ago", user: "@norminetteFan", action: "Bought", outcome: "Yes", price: "77¢", amount: 65, total: "$50.05" },
  { time: "24m ago", user: "@ftPongMaster", action: "Sold", outcome: "No", price: "22¢", amount: 40, total: "$8.80" },
  { time: "31m ago", user: "@evalQueen", action: "Bought", outcome: "Yes", price: "76¢", amount: 120, total: "$91.20" },
];

const quickAdds = [1, 5, 10, 50, 100];

/* ---------- page ---------- */

function MarketPage() {
  const { id } = Route.useParams();
  const market = markets.find((m) => m.id === id) ?? markets[0];
  const [range, setRange] = useState<Range>("ALL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState<number>(0);

  const data = useMemo(() => {
    const pts = { "1H": 60, "6H": 72, "1D": 96, "1W": 84, "1M": 90, ALL: 140 }[range];
    return genSeries(42 + range.length, pts, 55, 6);
  }, [range]);

  const price = outcome === "yes" ? outcomes[0].prob : outcomes[1].prob;
  const shares = amount > 0 ? (amount / (price / 100)).toFixed(2) : "0.00";
  const cost = amount > 0 ? amount.toFixed(2) : "0.00";

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />

      {/* breadcrumb */}
      <div className="border-b border-border/40 bg-background/60">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Markets</Link>
          <span>/</span>
          <span className="text-foreground/80">CPP Module</span>
          <span>/</span>
          <span className="font-mono text-foreground">#EXB-78321</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        {/* HEADER */}
        <MarketHeader />

        {/* GRID */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <ChartCard data={data} range={range} setRange={setRange} />
            <StatsRow />
            <OutcomesTable />
            <RecentTrades />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <TradePanel
              side={side}
              setSide={setSide}
              outcome={outcome}
              setOutcome={setOutcome}
              amount={amount}
              setAmount={setAmount}
              shares={shares}
              cost={cost}
            />
            <MarketInfo />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ---------- components ---------- */

function MarketHeader() {
  return (
    <header className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
          <span className="font-display text-xl font-bold text-primary-foreground">42</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
              CPP Module
            </span>
            <span className="rounded-md border border-border/60 bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Exam
            </span>
            <span className="rounded-md border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
              ● Live
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Will <span className="text-gradient-brand">JohnDoe</span> pass the CPP Module Exam?
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>42 Paris</span>
            <span className="text-border">•</span>
            <span>Evaluated by Peer Committee</span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Closes May 28, 2026
            </span>
          </p>
        </div>

      </div>

      {/* outcome quick row */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button className="group flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3 transition hover:bg-success/15">
          <span className="font-mono text-xs uppercase tracking-wider text-success/80">Yes</span>
          <span className="font-display text-2xl font-bold text-success">79%</span>
        </button>
        <button className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 transition hover:bg-destructive/15">
          <span className="font-mono text-xs uppercase tracking-wider text-destructive/80">No</span>
          <span className="font-display text-2xl font-bold text-destructive">21%</span>
        </button>
      </div>
    </header>
  );
}

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
      {children}
    </button>
  );
}

function ChartCard({
  data,
  range,
  setRange,
}: {
  data: ReturnType<typeof genSeries>;
  range: Range;
  setRange: (r: Range) => void;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Legend color="oklch(0.78 0.20 150)" label="Yes" value="79%" />
          <Legend color="oklch(0.68 0.22 18)" label="No" value="21%" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
                range === r
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="yesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.20 150)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.78 0.20 150)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="noFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.68 0.22 18)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.68 0.22 18)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.4 0.06 270 / 0.18)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="oklch(0.68 0.03 265)"
              tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              orientation="right"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="oklch(0.68 0.03 265)"
              tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: "oklch(0.22 0.05 270 / 0.95)",
                border: "1px solid oklch(0.4 0.06 270 / 0.5)",
                borderRadius: 12,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
              }}
              labelStyle={{ color: "oklch(0.68 0.03 265)" }}
              formatter={(v: number, n: string) => [`${v}%`, n.toUpperCase()]}
            />
            <Area type="monotone" dataKey="yes" stroke="oklch(0.78 0.20 150)" strokeWidth={2} fill="url(#yesFill)" />
            <Area type="monotone" dataKey="no" stroke="oklch(0.68 0.22 18)" strokeWidth={2} fill="url(#noFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-sm font-semibold">{value}</span>
    </div>
  );
}

function StatsRow() {
  const stats = [
    { label: "Volume", value: "23,458.42", suffix: "₳", icon: BarChart3 },
    { label: "Traders", value: "1,248", suffix: "", icon: Users },
    { label: "Liquidity", value: "12,340.00", suffix: "₳", icon: Droplets },
    { label: "Closes", value: "May 28, 2026", suffix: "18:00", icon: Clock },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">{s.label}</span>
            <s.icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold">{s.value}</span>
            {s.suffix && <span className="font-mono text-xs text-muted-foreground">{s.suffix}</span>}
          </div>
        </div>
      ))}
    </section>
  );
}

function OutcomesTable() {
  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card shadow-card">
      <header className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h2 className="font-display text-lg font-semibold">Outcomes</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Order book</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-wider">Outcome</th>
              <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-wider">Probability</th>
              <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-wider">24h Change</th>
              <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-wider">Buy Yes</th>
              <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-wider">Buy No</th>
              <th className="px-5 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-wider">Volume</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map((o) => (
              <tr key={o.name} className="border-t border-border/40 transition hover:bg-surface/40">
                <td className="px-5 py-4">
                  <span
                    className={`font-display text-base font-semibold ${
                      o.positive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {o.name}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono">{o.prob}%</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-xs ${
                      o.change > 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {o.change > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {Math.abs(o.change)}%
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button className="rounded-md border border-success/30 bg-success/10 px-2.5 py-1 font-mono text-xs text-success transition hover:bg-success/20">
                    {o.buy}¢
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-xs text-destructive transition hover:bg-destructive/20">
                    {o.sell}¢
                  </button>
                </td>
                <td className="px-5 py-4 text-right font-mono">{o.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentTrades() {
  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card shadow-card">
      <header className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live
        </span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              {["Time", "User", "Action", "Outcome", "Price", "Amount", "Total"].map((h) => (
                <th key={h} className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTrades.map((t, i) => (
              <tr key={i} className="border-t border-border/40 transition hover:bg-surface/40">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{t.time}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-6 w-6 place-items-center rounded-full bg-gradient-violet font-mono text-[10px] font-bold"
                    >
                      {t.user.charAt(1).toUpperCase()}
                    </span>
                    <span className="font-mono text-xs">{t.user}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{t.action}</span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
                      t.outcome === "Yes"
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {t.outcome}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs">{t.price}</td>
                <td className="px-5 py-3 font-mono text-xs">{t.amount}</td>
                <td className="px-5 py-3 font-mono text-xs font-semibold">{t.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TradePanel({
  side,
  setSide,
  outcome,
  setOutcome,
  amount,
  setAmount,
  shares,
  cost,
}: {
  side: "buy" | "sell";
  setSide: (s: "buy" | "sell") => void;
  outcome: "yes" | "no";
  setOutcome: (o: "yes" | "no") => void;
  amount: number;
  setAmount: (n: number) => void;
  shares: string;
  cost: string;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Trade</h3>
        <span className="rounded-md border border-border/60 bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Auto ▾
        </span>
      </div>

      {/* tabs */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-border/60 bg-surface p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
              side === s ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* outcome */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setOutcome("yes")}
          className={`rounded-xl border px-3 py-3 text-left transition ${
            outcome === "yes"
              ? "border-success bg-success/15 shadow-[0_0_24px_oklch(0.78_0.20_150/0.25)]"
              : "border-success/30 bg-success/5 hover:bg-success/10"
          }`}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-success/80">Yes</div>
          <div className="font-display text-xl font-bold text-success">79¢</div>
        </button>
        <button
          onClick={() => setOutcome("no")}
          className={`rounded-xl border px-3 py-3 text-left transition ${
            outcome === "no"
              ? "border-destructive bg-destructive/15 shadow-[0_0_24px_oklch(0.68_0.22_18/0.25)]"
              : "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
          }`}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-destructive/80">No</div>
          <div className="font-display text-xl font-bold text-destructive">21¢</div>
        </button>
      </div>

      {/* amount */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Amount</label>
          <span className="font-display text-2xl font-bold tabular-nums">${cost}</span>
        </div>
        <input
          type="number"
          min={0}
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="0"
          className="mt-2 h-11 w-full rounded-xl border border-border/60 bg-surface px-3 font-mono text-base focus:border-primary/60 focus:outline-none"
        />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {quickAdds.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(amount + q)}
              className="rounded-lg border border-border/60 bg-surface px-1 py-1.5 font-mono text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              +{q}
            </button>
          ))}
        </div>
      </div>

      {/* estimates */}
      <div className="mt-5 space-y-2 rounded-xl border border-border/40 bg-surface/60 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Shares</span>
          <span className="font-mono tabular-nums">{shares}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Cost</span>
          <span className="font-mono tabular-nums">${cost}</span>
        </div>
        <div className="flex justify-between border-t border-border/40 pt-2">
          <span className="text-muted-foreground">Potential payout</span>
          <span className="font-mono font-semibold text-success tabular-nums">
            ${amount > 0 ? (Number(shares)).toFixed(2) : "0.00"}
          </span>
        </div>
      </div>

      <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-violet text-sm font-semibold text-foreground shadow-elevated transition hover:opacity-95">
        <Sparkles className="h-4 w-4" />
        Place Prediction
      </button>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        By trading, you agree to the <a className="underline decoration-dotted underline-offset-2">Terms of Use</a>.
      </p>
    </section>
  );
}

function MarketInfo() {
  const rows = [
    { k: "Creator", v: (
      <span className="inline-flex items-center gap-1.5">
        ExamBet Admin <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
      </span>
    ) },
    { k: "Created", v: "May 10, 2026 · 14:32" },
    { k: "Market ID", v: <span className="font-mono">#EXB-78321</span> },
    { k: "Category", v: "CPP · Exam" },
  ];
  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card">
      <header className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Market Info</h3>
        <ShieldCheck className="h-4 w-4 text-accent" />
      </header>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((r) => (
          <div key={r.k} className="flex items-start justify-between gap-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.k}</dt>
            <dd className="text-right">{r.v}</dd>
          </div>
        ))}
        <div className="border-t border-border/40 pt-3">
          <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rules</dt>
          <dd className="mt-1 text-sm leading-relaxed text-foreground/80">
            The market resolves to <span className="font-semibold text-success">"Yes"</span> if JohnDoe passes the CPP Module
            Exam before the deadline with a passing grade.
          </dd>
        </div>
      </dl>
      <button className="mt-4 h-10 w-full rounded-xl border border-border/60 bg-surface text-sm font-medium text-foreground transition hover:border-primary/40">
        View Full Rules
      </button>
    </section>
  );
}
