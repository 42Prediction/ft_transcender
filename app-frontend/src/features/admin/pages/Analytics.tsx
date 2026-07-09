import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChevronLeft, Download, Loader2, Users as UsersIcon } from "lucide-react";
import { marketApi, type AnalyticsData } from "@/api/market/market.api";
import { useMarketUpdates } from "@/features/market/hooks/useMarketUpdates";

const PALETTE = [
    "var(--primary)",
    "var(--accent)",
    "var(--warning)",
    "var(--success)",
    "var(--destructive)",
    "var(--no)",
];

const PRESETS: { label: string; days: number }[] = [
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "90D", days: 90 },
];

function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function defaultRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: toISODate(from), to: toISODate(to) };
}

function downloadCsv(data: AnalyticsData) {
    const lines: string[] = [];
    lines.push("date,volume,bets");
    for (const p of data.series) {
        lines.push(`${p.date},${p.volume},${p.bets}`);
    }
    lines.push("");
    lines.push("category,volume,bets");
    for (const c of data.categories) {
        lines.push(`"${c.category}",${c.volume},${c.bets}`);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `market-analytics-${data.from.slice(0, 10)}_${data.to.slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

const chartTooltipStyle = {
    contentStyle: {
        background: "color-mix(in oklch, var(--background) 85%, transparent)",
        border: "1px solid var(--border)",
        borderRadius: "0.75rem",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
    },
    labelStyle: { color: "var(--muted-foreground)" },
};

export default function AnalyticsPage() {
    const [range, setRange] = useState(defaultRange());
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async (from: string, to: string) => {
        setLoading(true);
        try {
            const res = await marketApi.getAnalytics(from, to);
            setData(res);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics(range.from, range.to);
    }, [range.from, range.to, fetchAnalytics]);

    // Real-time: any market activity (a new bet, a resolution) can shift these
    // aggregates. Debounce so a burst of updates triggers one refetch, not N.
    const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scheduleRefetch = useCallback(() => {
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(() => fetchAnalytics(range.from, range.to), 1500);
    }, [fetchAnalytics, range.from, range.to]);
    useMarketUpdates(scheduleRefetch, scheduleRefetch);

    const pieData = useMemo(
        () =>
            (data?.categories ?? []).map((c, i) => ({
                name: c.category,
                value: c.volume,
                color: PALETTE[i % PALETTE.length],
            })),
        [data],
    );

    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                    <Link
                        to="/admin/users"
                        className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <UsersIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Users</span>
                    </Link>
                    <div>
                        <h1 className="text-lg font-medium text-foreground">Analytics</h1>
                        <p className="text-xs text-muted-foreground">
                            Volume, bets and category breakdown
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 rounded-lg border border-border/60 bg-surface p-1">
                        {PRESETS.map((p) => (
                            <button
                                key={p.label}
                                onClick={() => {
                                    const to = new Date();
                                    const from = new Date(to.getTime() - p.days * 24 * 60 * 60 * 1000);
                                    setRange({ from: toISODate(from), to: toISODate(to) });
                                }}
                                className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <input
                        type="date"
                        value={range.from}
                        max={range.to}
                        onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                        className="h-8 rounded-lg border border-border/60 bg-surface px-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                        type="date"
                        value={range.to}
                        min={range.from}
                        max={toISODate(new Date())}
                        onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                        className="h-8 rounded-lg border border-border/60 bg-surface px-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                    <button
                        onClick={() => data && downloadCsv(data)}
                        disabled={!data}
                        className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-40"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export CSV
                    </button>
                </div>
            </div>

            {loading && !data ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : !data || data.series.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-border/40 bg-surface text-sm text-muted-foreground">
                    No activity in this range.
                </div>
            ) : (
                <>
                    {/* summary tiles */}
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
                            <p className="text-xs text-muted-foreground">Total volume</p>
                            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
                                xp {data.totals.volume.toFixed(0)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
                            <p className="text-xs text-muted-foreground">Total bets</p>
                            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
                                {data.totals.bets}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
                            <p className="text-xs text-muted-foreground">Avg volume / day</p>
                            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
                                xp {(data.totals.volume / Math.max(1, data.series.length)).toFixed(0)}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        {/* volume trend — line/area chart */}
                        <div className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card lg:col-span-2">
                            <h3 className="mb-3 text-sm font-medium text-foreground">Volume over time</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={data.series}>
                                    <defs>
                                        <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--muted-foreground)" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--muted-foreground)" }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={48}
                                    />
                                    <Tooltip
                                        {...chartTooltipStyle}
                                        formatter={(v: any) => [`xp ${Number(v).toFixed(0)}`, "Volume"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="volume"
                                        stroke="var(--primary)"
                                        strokeWidth={2}
                                        fill="url(#volumeFill)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* category breakdown — pie chart */}
                        <div className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
                            <h3 className="mb-3 text-sm font-medium text-foreground">Volume by category</h3>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                                        {pieData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        {...chartTooltipStyle}
                                        formatter={(v: any, n: any) => [`xp ${Number(v).toFixed(0)}`, n]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-2 space-y-1">
                                {pieData.map((c) => (
                                    <div key={c.name} className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: c.color }}
                                            />
                                            {c.name}
                                        </span>
                                        <span className="font-mono text-foreground">xp {c.value.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* bets per day — bar chart */}
                    <div className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card">
                        <h3 className="mb-3 text-sm font-medium text-foreground">Bets per day</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={data.series}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--muted-foreground)" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--muted-foreground)" }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={32}
                                />
                                <Tooltip {...chartTooltipStyle} formatter={(v: any) => [v, "Bets"]} />
                                <Bar dataKey="bets" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}
