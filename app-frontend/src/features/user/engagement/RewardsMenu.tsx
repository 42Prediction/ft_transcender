import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Circle, Flame, Gift, Loader2 } from 'lucide-react';
import { useDailyBonus } from './useDailyBonus';
import { useQuests } from './useQuests';

export function RewardsMenu() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const daily = useDailyBonus();
  const quests = useQuests();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canClaimDaily = !!daily.status?.canClaim;
  const claimableQuests = quests.data?.claimableTotal ?? 0;
  const hasReward = canClaimDaily || claimableQuests > 0;
  const streak = daily.justClaimed?.streak ?? daily.status?.streak ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Rewards"
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:text-foreground"
      >
        <Gift className="h-4 w-4" />
        {hasReward && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary shadow-glow" />
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-20 z-50 max-h-[70vh] origin-top-right overflow-y-auto rounded-xl border border-border/60 bg-background p-4 shadow-xl backdrop-blur-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-[340px]">
          {/* Daily bonus */}
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Daily bonus</h3>
            <span className="flex items-center gap-1 rounded-lg bg-surface px-2 py-1 font-mono text-[11px] text-muted-foreground">
              <Flame className={`h-3.5 w-3.5 ${streak > 0 ? 'text-orange-400' : ''}`} />
              {streak} day{streak === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-3">
            {daily.loading && !daily.status ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : daily.justClaimed ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 py-3 text-success">
                <Check className="h-5 w-5" />
                <span className="font-display font-semibold">
                  +xp {daily.justClaimed.reward.toLocaleString('pt-PT')} · day {daily.justClaimed.streak}
                </span>
              </div>
            ) : canClaimDaily ? (
              <button
                onClick={() => void daily.claim()}
                disabled={daily.claiming}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
              >
                {daily.claiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Claim xp {(daily.status?.nextReward ?? 0).toLocaleString('pt-PT')} · day {daily.status?.nextStreak}</>
                )}
              </button>
            ) : (
              <p className="rounded-xl bg-surface/60 py-2.5 text-center text-xs text-muted-foreground">
                Claimed today · come back tomorrow
              </p>
            )}
          </div>

          <div className="my-4 border-t border-border/40" />

          {/* Quests */}
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Quests</h3>
            {claimableQuests > 0 && (
              <span className="rounded-lg bg-primary/15 px-2 py-1 font-mono text-[11px] font-semibold text-primary">
                xp {claimableQuests.toLocaleString('pt-PT')} ready
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1">
            {quests.loading && !quests.data ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              quests.data?.quests.map((q) => {
                const Icon = q.claimed ? CheckCircle2 : Circle;
                return (
                  <div
                    key={q.key}
                    className={`flex items-start gap-3 rounded-xl px-2 py-2 ${q.met && !q.claimed ? 'bg-surface/60' : ''}`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        q.claimed ? 'text-success' : q.met ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm font-medium ${q.claimed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {q.title}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">xp {q.reward}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{q.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {claimableQuests > 0 && (
            <button
              onClick={() => void quests.claim()}
              disabled={quests.claiming}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
            >
              {quests.claiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Claim xp {claimableQuests.toLocaleString('pt-PT')}</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
