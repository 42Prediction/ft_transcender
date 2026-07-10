import { MapPin, Calendar, UserPen } from "lucide-react";
import { Link } from "react-router-dom";
import type { Bettor } from "../route";
import type { BettorStats } from "@/api/market/market.api";


interface Props {
  bettor: Bettor;
  isOwn: boolean;
  stats: BettorStats | null;
}

export function ProfileHeader({ bettor, isOwn, stats }: Props) {
  const pnlNum = stats ? parseFloat(stats.pnl) : 0;
  const pnlUp = pnlNum >= 0;

  const quickMetrics = [
    {
      label: "Net P&L",
      value: `${pnlUp ? "+" : "-"}xp ${Math.abs(pnlNum).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`,
      className: pnlUp ? "text-[color:var(--yes)]" : "text-[color:var(--no)]",
    },
    { label: "Win rate", value: `${stats?.winRate ?? 0}%`, className: "" },
    { label: "Predictions", value: String(stats?.totalBets ?? 0), className: "" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card p-6 md:p-8">
      <div className="relative grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">

        {/* Avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-brand opacity-50" />
          <div className="relative grid h-28 w-28 place-items-center rounded-3xl border-2 border-primary/60 bg-surface p-1">
            <img
              src={bettor?.avatar ?? `https://api.dicebear.com/10.x/glass/svg?seed=${bettor?.nick ?? "user"}`}
              alt={bettor?.nick}
              className="h-full w-full rounded-2xl object-cover"
            />
          </div>
        </div>

        {/* Identity */}
        <div className="space-y-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {bettor?.nick ?? "—"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-mono text-foreground/80">@{bettor?.nick ?? "—"}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {bettor?.campus ?? "—"}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {bettor?.createdAt
                  ? new Date(bettor.createdAt).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            {bettor?.bio && (
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{bettor.bio}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 sm:max-w-md">
            {quickMetrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border/60 bg-surface/60 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className={`mt-0.5 font-mono text-sm font-semibold ${m.className}`}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isOwn && (
          <div className="flex flex-col gap-2">
            <Link
              to="/user/settings"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <UserPen className="h-4 w-4" /> Edit
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
