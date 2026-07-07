import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BettorPosition } from '@/api/market/market.api';

type Filter = 'ALL' | 'OPEN' | 'WON' | 'LOST';

const FILTERS: Filter[] = ['ALL', 'OPEN', 'WON', 'LOST'];

const STATUS_STYLE: Record<BettorPosition['status'], string> = {
  WON: 'bg-success/10 text-success',
  LOST: 'bg-destructive/10 text-destructive',
  OPEN: 'bg-primary/10 text-primary',
  CANCELLED: 'bg-surface text-muted-foreground',
};

const STATUS_LABEL: Record<BettorPosition['status'], string> = {
  WON: 'Won',
  LOST: 'Lost',
  OPEN: 'In progress',
  CANCELLED: 'Cancelled',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function BetHistory({ positions }: { positions: BettorPosition[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = useMemo(
    () => (filter === 'ALL' ? positions : positions.filter((p) => p.status === filter)),
    [positions, filter],
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card overflow-hidden shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-6 py-4">
        <h2 className="font-display text-lg font-semibold">Bet History</h2>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
                filter === f
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'OPEN' ? 'In progress' : f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          {positions.length === 0 ? 'No bets placed yet.' : 'No bets match this filter.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 text-left font-mono">Market</th>
                <th className="px-4 py-3 text-center font-mono">Side</th>
                <th className="px-4 py-3 text-right font-mono">Amount</th>
                <th className="px-4 py-3 text-right font-mono hidden sm:table-cell">Entry</th>
                <th className="px-4 py-3 text-right font-mono">Result</th>
                <th className="px-4 py-3 text-center font-mono">Status</th>
                <th className="px-6 py-3 text-right font-mono hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((pos) => {
                const pnlNum = pos.pnl != null ? parseFloat(pos.pnl) : null;
                return (
                  <tr key={pos.id} className="hover:bg-surface/40 transition">
                    <td className="max-w-[220px] px-6 py-4">
                      <Link to={`/market/${pos.marketId}`} className="block truncate font-medium hover:text-primary transition">
                        {pos.market}
                      </Link>
                      {pos.subject && (
                        <span className="font-mono text-[11px] text-muted-foreground">@{pos.subject}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`rounded-lg px-2 py-0.5 font-mono text-xs font-semibold ${
                          pos.side === 'YES'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {pos.side}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">₳ {pos.amount.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right font-mono text-muted-foreground hidden sm:table-cell">
                      {Math.round(pos.entry * 100)}¢
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-mono font-semibold ${
                        pnlNum == null
                          ? 'text-muted-foreground'
                          : pnlNum >= 0
                            ? 'text-success'
                            : 'text-destructive'
                      }`}
                    >
                      {pnlNum == null ? '—' : `${pnlNum >= 0 ? '+' : ''}₳ ${Math.abs(pnlNum).toFixed(2)}`}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_STYLE[pos.status]}`}>
                        {STATUS_LABEL[pos.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                      {formatDate(pos.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
