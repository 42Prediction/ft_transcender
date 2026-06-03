// import { createFileRoute } from "react-router-dom";
import  Navbar  from "../../../features/public/components/Navbar";
import  Footer  from "../../../components/Footer";
import {
  BadgeCheck,
  Share2,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Activity as ActivityIcon,
  Flame,
  Shield,
  Users,
  Star,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import { useState } from "react";

// export const Route = createFileRoute("/profile")({
//   head: () => ({
//     meta: [
//       { title: "Léa Moreau — ExamBet Profile" },
//       { name: "description", content: "Elite Strategist profile on ExamBet — track accuracy, P&L, active predictions, badges and reputation across 42 markets." },
//       { property: "og:title", content: "Léa Moreau — ExamBet Profile" },
//       { property: "og:description", content: "Profile dashboard: accuracy 73.4%, +12.5k P&L, 486 predictions, 9 live." },
//     ],
//   }),
//   component: ProfilePage,
// });

/* ---------- Demo data ---------- */
const user = {
  name: "Léa Moreau",
  handle: "@lmoreau",
  campus: "42 Paris",
  joined: "Sep 2023",
  level: 27,
  levelProgress: 68,
  badges: ["Elite Strategist", "Trusted Analyst"],
  avatar: "https://api.dicebear.com/9.x/glass/svg?seed=lmoreau&backgroundType=gradientLinear",
};

const metrics = [
  { label: "Accuracy", value: "73.4%", trend: "+2.1%", up: true, icon: Target },
  { label: "Net P&L", value: "+₳ 12.5k", trend: "+6.2%", up: true, icon: TrendingUp },
  { label: "Reputation", value: "8,420", trend: "+184", up: true, icon: Shield },
  { label: "Total Predictions", value: "486", trend: "9 live", up: true, icon: ActivityIcon },
  { label: "Win / Loss", value: "318 / 132", trend: "2.4 ratio", up: true, icon: Trophy },
  { label: "ROI Index", value: "1.92×", trend: "+0.14", up: true, icon: Sparkles },
];

const accuracyTrend = [
  { m: "Nov", acc: 61, roi: 1.3 },
  { m: "Dec", acc: 64, roi: 1.4 },
  { m: "Jan", acc: 66, roi: 1.5 },
  { m: "Feb", acc: 65, roi: 1.55 },
  { m: "Mar", acc: 69, roi: 1.62 },
  { m: "Apr", acc: 71, roi: 1.74 },
  { m: "May", acc: 72, roi: 1.81 },
  { m: "Jun", acc: 73.4, roi: 1.92 },
];

const winLoss = [
  { name: "Won", value: 318, color: "var(--yes)" },
  { name: "Lost", value: 132, color: "var(--no)" },
  { name: "Pending", value: 36, color: "var(--accent)" },
];

const activePredictions = [
  { title: "ft_transcendence — Final Eval", range: "Outcome: Pass", time: "2d 14h", conf: 85, prob: 78, stake: "₳ 450", live: 4 },
  { title: "Piscine C — Exam 02", range: "Score 90–100", time: "18h 02m", conf: 60, prob: 41, stake: "₳ 220", live: 7 },
  { title: "Inception — Peer Review", range: "Outcome: Pass", time: "3d 06h", conf: 92, prob: 88, stake: "₳ 600", live: 2 },
  { title: "minishell — Defense", range: "Score 75–89", time: "5d 09h", conf: 45, prob: 52, stake: "₳ 180", live: 3 },
];

type HistRow = { market: string; cat: string; predicted: string; outcome: "Won" | "Lost" | "Pending"; date: string; pnl: string };
const history: HistRow[] = [
  { market: "Born2beroot — Pass/Fail", cat: "Projects", predicted: "Pass", outcome: "Won", date: "Aug 28", pnl: "+₳ 320" },
  { market: "Piscine C — Exam 04", cat: "Piscine", predicted: "Score 90–100", outcome: "Won", date: "Aug 24", pnl: "+₳ 540" },
  { market: "push_swap — Pass/Fail", cat: "Projects", predicted: "Pass", outcome: "Lost", date: "Aug 20", pnl: "-₳ 210" },
  { market: "get_next_line — Score 75–89", cat: "Projects", predicted: "84", outcome: "Won", date: "Aug 15", pnl: "+₳ 190" },
  { market: "Common Core — Peer Eval", cat: "Peer Evals", predicted: "Pass/Fail → Pass", outcome: "Won", date: "Aug 11", pnl: "+₳ 280" },
  { market: "Philosophers — Score 90–100", cat: "Projects", predicted: "95", outcome: "Lost", date: "Aug 06", pnl: "-₳ 260" },
  { market: "libft — Pass/Fail", cat: "Piscine", predicted: "Pending", outcome: "Pending", date: "Aug 02", pnl: "₳ 0" },
];

const attributes = [
  { label: "Accuracy", value: 86 },
  { label: "Consistency", value: 74 },
  { label: "Participation", value: 92 },
  { label: "Community Trust", value: 81 },
];

const badges = [
  { name: "100% Piscine Week", icon: Flame, tone: "primary" },
  { name: "Top Core Predictor", icon: Trophy, tone: "accent" },
  { name: "Streak Master x12", icon: Star, tone: "warning" },
  { name: "Underdog Hunter", icon: Target, tone: "destructive" },
  { name: "Early Adopter", icon: Sparkles, tone: "primary" },
  { name: "Eval Oracle", icon: Award, tone: "accent" },
];

const feed = [
  { icon: CheckCircle2, color: "text-[color:var(--yes)]", text: "Predicted Pass on ft_transcendence Final Eval", time: "2h ago" },
  { icon: TrendingUp, color: "text-primary", text: "Won prediction on Born2beroot (+₳ 320)", time: "5h ago" },
  { icon: Award, color: "text-accent", text: "Earned badge Streak Master x12", time: "1d ago" },
  { icon: TrendingDown, color: "text-[color:var(--no)]", text: "Lost prediction on push_swap (-₳ 210)", time: "2d ago" },
  { icon: UserPlus, color: "text-foreground", text: "Started following @tbedev", time: "3d ago" },
];

const topPerformances = [
  { market: "Piscine C — Exam 04", pnl: "+₳ 540", acc: "98%" },
  { market: "Common Core Peer Eval", pnl: "+₳ 280", acc: "94%" },
  { market: "Born2beroot Pass", pnl: "+₳ 320", acc: "91%" },
  { market: "get_next_line 84", pnl: "+₳ 190", acc: "88%" },
];

/* ---------- Page ---------- */
import { bettor } from "../../../api/bettor/bettor.api.ts";

interface Bettor {
  nick: string;
  bio: string;
  avatar: string;
  isNickSet: boolean;
}

export async function privateProfileLoader(): Promise<Bettor> {
  const res = await bettor.getMe();
  return res.data;
}

export async function publicProfileLoader(
  { params }: { params: { nick: string } }
): Promise<Bettor> {
  const res = await bettor.getByNick(params.nick);
  return res.data;
}

export default function ProfilePage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-hero opacity-60" />
      <div className="relative">
        <main className="mx-auto max-w-[1400px] px-6 py-8 space-y-8">
          <ProfileHeader />
          <StatsRow />
          <div className="grid gap-6 lg:grid-cols-3">
            <AccuracyChart />
            <WinLossChart />
          </div>
          <section>
            <SectionTitle title="Active Predictions" subtitle="Live markets you currently hold positions on" badge={`${activePredictions.length} open`} />
            <div className="grid gap-4 sm:grid-cols-2">
              {activePredictions.map((p) => <ActivePredictionCard key={p.title} p={p} />)}
            </div>
          </section>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <HistoryTable />
            <aside className="space-y-6">
              <ReputationCard />
              <ActivityFeed />
            </aside>
          </div>
          <TopPerformances />
        </main>
      </div>
    </div>
  );
}

/* ---------- Sections ---------- */
function SectionTitle({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {badge && <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{badge}</span>}
    </div>
  );
}

function ProfileHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card p-6 shadow-elevated md:p-8">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-glow opacity-60" />
      <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
        {/* Avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-brand opacity-50 blur-xl" />
          <div className="relative grid h-28 w-28 place-items-center rounded-3xl border-2 border-primary/60 bg-surface p-1 shadow-glow">
            <img src={user.avatar} alt={user.name} className="h-full w-full rounded-2xl" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-primary/60 bg-background px-3 py-1 font-mono text-[11px] font-bold text-primary shadow-glow">
            LVL {user.level}
          </div>
        </div>

        {/* Identity */}
        <div className="space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{user.name}</h1>
              <BadgeCheck className="h-6 w-6 text-accent" />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-mono text-foreground/80">{user.handle}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {user.campus}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {user.joined}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((b) => (
              <span key={b} className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Sparkles className="h-3 w-3" /> {b}
              </span>
            ))}
          </div>
          {/* Mini metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 sm:max-w-md">
            {metrics.slice(0, 3).map((m) => (
              <div key={m.label} className="rounded-xl border border-border/60 bg-surface/60 px-3 py-2 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="mt-0.5 font-mono text-sm font-semibold">{m.value}</div>
                <div className={`text-[10px] ${m.up ? "text-[color:var(--yes)]" : "text-[color:var(--no)]"}`}>{m.trend}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button className="flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">
            <UserPlus className="h-4 w-4" /> Follow
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-elevated">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card transition hover:border-primary/40">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${m.up ? "bg-[color:var(--yes)]/15 text-[color:var(--yes)]" : "bg-[color:var(--no)]/15 text-[color:var(--no)]"}`}>
                {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {m.trend}
              </span>
            </div>
            <div className="mt-3 font-mono text-xl font-bold tracking-tight">{m.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function AccuracyChart() {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Accuracy & ROI Trend</h3>
          <p className="text-xs text-muted-foreground">8-month rolling performance</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-surface p-1 text-xs">
          {["3M", "6M", "1Y", "ALL"].map((r, i) => (
            <button key={r} className={`rounded-md px-2 py-1 ${i === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={accuracyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.88 0.22 130)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.88 0.22 130)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRoi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.16 210)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.78 0.16 210)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0.06 270 / 0.15)" />
            <XAxis dataKey="m" stroke="oklch(0.68 0.03 265)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.68 0.03 265)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.22 0.05 270 / 0.95)",
                border: "1px solid oklch(0.4 0.06 270 / 0.4)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="acc" stroke="oklch(0.88 0.22 130)" strokeWidth={2.5} fill="url(#gAcc)" />
            <Area type="monotone" dataKey="roi" stroke="oklch(0.78 0.16 210)" strokeWidth={2} fill="url(#gRoi)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Accuracy %</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> ROI Index</span>
      </div>
    </div>
  );
}

function WinLossChart() {
  const total = winLoss.reduce((s, x) => s + x.value, 0);
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold">Win / Loss Ratio</h3>
      <p className="text-xs text-muted-foreground">Career resolution breakdown</p>
      <div className="relative mt-2 h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={winLoss} dataKey="value" innerRadius={55} outerRadius={80} stroke="oklch(0.16 0.04 270)" strokeWidth={3} paddingAngle={2}>
              {winLoss.map((e, i) => <Cell key={i} fill={e.color} />)}
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
        {winLoss.map((w) => (
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

function ActivePredictionCard({ p }: { p: typeof activePredictions[number] }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card transition hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.range}</div>
          <h4 className="mt-1 font-display font-semibold leading-tight">{p.title}</h4>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[color:var(--yes)]/15 px-2 py-0.5 text-[10px] font-medium text-[color:var(--yes)]">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-[color:var(--yes)]" /> {p.live} live
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <Bar label="Your confidence" value={p.conf} tone="primary" />
        <Bar label="Market probability" value={p.prob} tone="accent" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {p.time}</span>
        <span className="font-mono font-semibold text-primary">{p.stake}</span>
      </div>
    </div>
  );
}

function Bar({ label, value, tone }: { label: string; value: number; tone: "primary" | "accent" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full ${tone === "primary" ? "bg-gradient-brand" : "bg-accent"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function HistoryTable() {
  const [filter, setFilter] = useState<"All" | "Won" | "Lost" | "Pending">("All");
  const rows = history.filter((r) => filter === "All" || r.outcome === filter);
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Prediction History</h3>
          <p className="text-xs text-muted-foreground">Resolved markets across all categories</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 bg-surface p-1 text-xs">
          {(["All", "Won", "Lost", "Pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 transition ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 font-medium">Market</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Predicted</th>
              <th className="pb-2 font-medium">Outcome</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 text-right font-medium">P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/40 last:border-0 transition hover:bg-surface/40">
                <td className="py-3 font-medium">{r.market}</td>
                <td className="py-3 text-muted-foreground">{r.cat}</td>
                <td className="py-3 font-mono text-xs text-muted-foreground">{r.predicted}</td>
                <td className="py-3">
                  <OutcomePill outcome={r.outcome} />
                </td>
                <td className="py-3 text-muted-foreground">{r.date}</td>
                <td className={`py-3 text-right font-mono font-semibold ${r.pnl.startsWith("+") ? "text-[color:var(--yes)]" : r.pnl.startsWith("-") ? "text-[color:var(--no)]" : "text-muted-foreground"}`}>{r.pnl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutcomePill({ outcome }: { outcome: "Won" | "Lost" | "Pending" }) {
  const map = {
    Won: { Icon: CheckCircle2, cls: "bg-[color:var(--yes)]/15 text-[color:var(--yes)]" },
    Lost: { Icon: XCircle, cls: "bg-[color:var(--no)]/15 text-[color:var(--no)]" },
    Pending: { Icon: Circle, cls: "bg-accent/15 text-accent" },
  } as const;
  const { Icon, cls } = map[outcome];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {outcome}
    </span>
  );
}

function ReputationCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Reputation</h3>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-xs text-primary">LVL {user.level}</span>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Elite Strategist</span>
          <span>{user.levelProgress}% to LVL {user.level + 1}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-gradient-brand shadow-glow" style={{ width: `${user.levelProgress}%` }} />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {attributes.map((a) => (
          <div key={a.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{a.label}</span>
              <span className="font-mono font-medium">{a.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-accent" style={{ width: `${a.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-border/60 pt-4">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Award className="h-3.5 w-3.5" /> Earned Badges
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => {
            const Icon = b.icon;
            const toneMap: Record<string, string> = {
              primary: "border-primary/40 bg-primary/10 text-primary",
              accent: "border-accent/40 bg-accent/10 text-accent",
              warning: "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
              destructive: "border-[color:var(--no)]/40 bg-[color:var(--no)]/10 text-[color:var(--no)]",
            };
            return (
              <span key={b.name} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneMap[b.tone]}`}>
                <Icon className="h-3 w-3" /> {b.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Activity</h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary" /> Live
        </span>
      </div>
      <ol className="relative space-y-4 border-l border-border/60 pl-5">
        {feed.map((f, i) => {
          const Icon = f.icon;
          return (
            <li key={i} className="relative">
              <span className={`absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full border border-border/60 bg-surface ${f.color}`}>
                <Icon className="h-3 w-3" />
              </span>
              <p className="text-sm leading-tight">{f.text}</p>
              <span className="text-[11px] text-muted-foreground">{f.time}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TopPerformances() {
  return (
    <section>
      <SectionTitle title="Top Performances" subtitle="Your best predictions of all time" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {topPerformances.map((t, i) => (
          <div key={t.market} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card transition hover:border-primary/40">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand font-mono text-xs font-bold text-primary-foreground shadow-glow">#{i + 1}</span>
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
