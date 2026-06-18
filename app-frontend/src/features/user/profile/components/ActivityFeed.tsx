import { CheckCircle2, TrendingUp, TrendingDown, Award, UserPlus } from "lucide-react";

const feed = [
  { Icon:CheckCircle2, color:"text-[color:var(--yes)]", text:"Predicted Pass on ft_transcendence Final Eval", ago:"2h ago"  },
  { Icon:TrendingUp,   color:"text-primary",             text:"Won prediction on Born2beroot (+₳ 320)",        ago:"5h ago"  },
  { Icon:Award,        color:"text-accent",               text:"Earned badge Streak Master x12",               ago:"1d ago"  },
  { Icon:TrendingDown, color:"text-[color:var(--no)]",   text:"Lost prediction on push_swap (-₳ 210)",         ago:"2d ago"  },
  { Icon:UserPlus,     color:"text-foreground",           text:"Started following @tbedev",                    ago:"3d ago"  },
];

export function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Activity</h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Live
        </span>
      </div>
      <ol className="relative space-y-4 border-l border-border/60 pl-5">
        {feed.map(({ Icon, color, text, ago }, i) => (
          <li key={i} className="relative">
            <span className={`absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full border border-border/60 bg-surface ${color}`}>
              <Icon className="h-3 w-3" />
            </span>
            <p className="text-sm leading-tight">{text}</p>
            <span className="text-[11px] text-muted-foreground">{ago}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}