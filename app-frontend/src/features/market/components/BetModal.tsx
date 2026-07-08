import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { marketApi, type MarketDto } from '@/api/market/market.api';
import { useRevalidator, useRouteLoaderData } from 'react-router-dom';

interface Props {
  market: MarketDto;
  initialSide: 'YES' | 'NO';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBetPlaced?: () => void;
}

function dicebear(seed: string) {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

export function BetModal({ market, initialSide, open, onOpenChange, onBetPlaced }: Props) {
  const root = useRouteLoaderData('root') as any;
  const balance: number = root?.data?.wallet?.balance ?? 0;
  const revalidator = useRevalidator();

  const [side, setSide] = useState<'YES' | 'NO'>(initialSide);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) setSide(initialSide);
  }, [open, initialSide]);

  const sidePrice = side === 'YES' ? market.yesPrice : market.noPrice;
  const sidePct = Math.round(sidePrice * 100);
  const amountNum = parseFloat(amount) || 0;
  const estimatedShares = amountNum > 0 ? amountNum / sidePrice : 0;
  const estimatedPayout = estimatedShares;

  const isValid = amountNum >= 1 && amountNum <= balance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await marketApi.placeBet(market.id, side, amountNum);
      setSuccess(true);
      revalidator.revalidate();
      onBetPlaced?.();
      setTimeout(() => {
        setSuccess(false);
        setAmount('');
        setError(null);
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to place bet. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(o: boolean) {
    if (!o) {
      setAmount('');
      setError(null);
      setSuccess(false);
    }
    onOpenChange(o);
  }

  const quickAmounts = [10, 25, 50, 100];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="overflow-hidden border-border/60 bg-transparent p-0 sm:max-w-[420px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Place Bet</DialogTitle>
        <div className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-elevated backdrop-blur-2xl sm:p-7">

          {/* Market info */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <img
                src={market.avatar ?? dicebear(market.handle)}
                alt={market.student}
                className="h-11 w-11 shrink-0 rounded-xl object-cover bg-surface"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = dicebear(market.handle); }}
              />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  @{market.handle}
                </p>
                <p className="truncate font-semibold leading-snug">
                  {market.project.split(' — ')[0]}
                </p>
              </div>
            </div>
            <h2 className="font-display text-xl font-bold">Place Your Bet</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Balance:{' '}
              <span className="font-mono text-foreground">
                xp {balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Side toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('YES')}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border p-4 transition',
                  side === 'YES'
                    ? 'border-success/60 bg-success/15 text-success'
                    : 'border-border/60 bg-surface text-muted-foreground hover:text-foreground',
                )}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-mono text-[10px] uppercase tracking-wider">YES</span>
                <span className="font-display text-2xl font-bold">
                  {Math.round(market.yesPrice * 100)}%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSide('NO')}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border p-4 transition',
                  side === 'NO'
                    ? 'border-destructive/60 bg-destructive/15 text-destructive'
                    : 'border-border/60 bg-surface text-muted-foreground hover:text-foreground',
                )}
              >
                <TrendingDown className="h-5 w-5" />
                <span className="font-mono text-[10px] uppercase tracking-wider">NO</span>
                <span className="font-display text-2xl font-bold">
                  {Math.round(market.noPrice * 100)}%
                </span>
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Amount (xp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  xp
                </span>
                <input
                  type="number"
                  min="1"
                  max={balance}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="h-12 w-full rounded-xl border border-border/60 bg-surface pl-8 pr-4 font-mono text-lg focus:border-primary/50 focus:outline-none transition"
                />
              </div>
              <div className="mt-2 flex gap-2">
                {quickAmounts.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(Math.min(v, Math.floor(balance))))}
                    className="rounded-lg border border-border/60 bg-surface px-2.5 py-1 font-mono text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    xp {v}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.floor(balance)))}
                  className="ml-auto rounded-lg border border-border/60 bg-surface px-2.5 py-1 font-mono text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Payout preview */}
            {amountNum >= 1 && (
              <div className="rounded-xl border border-border/40 bg-surface p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry price</span>
                  <span className="font-mono">{sidePct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-mono">{estimatedShares.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-2">
                  <span className="text-muted-foreground">Est. max payout</span>
                  <span
                    className={cn(
                      'font-mono font-semibold',
                      side === 'YES' ? 'text-success' : 'text-destructive',
                    )}
                  >
                    xp {estimatedPayout.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  * Max payout assumes no other bets on this side. Actual payout is shared among all winning bettors.
                </p>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-xs text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-center text-xs text-success">
                Bet placed successfully!
              </p>
            )}

            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all',
                side === 'YES' ? 'bg-success' : 'bg-destructive',
                isValid && !submitting ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50',
              )}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Bet ${side} · xp ${amountNum > 0 ? amountNum.toFixed(0) : '0'}`
              )}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
