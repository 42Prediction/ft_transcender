import { Award, Flame, Trophy, Star, Target, Sparkles } from "lucide-react";

const attributes = [
  { label:"Accuracy",        value:86 },
  { label:"Consistency",     value:74 },
  { label:"Participation",   value:92 },
  { label:"Community Trust", value:81 },
];

const badges = [
  { name:"100% Piscine Week", Icon:Flame,    tone:"primary"     },
  { name:"Top Core Predictor",Icon:Trophy,   tone:"accent"      },
  { name:"Streak Master x12", Icon:Star,     tone:"warning"     },
  { name:"Underdog Hunter",   Icon:Target,   tone:"destructive" },
  { name:"Early Adopter",     Icon:Sparkles, tone:"primary"     },
  { name:"Eval Oracle",       Icon:Award,    tone:"accent"      },
];

const toneMap: Record<string, string> = {
  primary:     "border-primary/40 bg-primary/10 text-primary",
  accent:      "border-accent/40 bg-accent/10 text-accent",
  warning:     "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
  destructive: "border-[color:var(--no)]/40 bg-[color:var(--no)]/10 text-[color:var(--no)]",
};

export function ReputationCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Reputation</h3>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-xs text-primary">
          LVL 27
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Elite Strategist</span>
          <span>68% to LVL 28</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-gradient-brand shadow-glow" style={{ width:"68%" }} />
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
              <div className="h-full rounded-full bg-accent" style={{ width:`${a.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Award className="h-3.5 w-3.5" /> Earned Badges
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map(({ name, Icon, tone }) => (
            <span key={name} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneMap[tone]}`}>
              <Icon className="h-3 w-3" /> {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}