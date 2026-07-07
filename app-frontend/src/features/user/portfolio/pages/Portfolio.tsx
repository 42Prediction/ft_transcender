import { useLoaderData } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import type { Portfolio } from '@/api/market/market.api';
import { marketApi } from '@/api/market/market.api';

export async function portfolioLoader(): Promise<Portfolio | null> {
  try {
    return await marketApi.getPortfolio();
  } catch {
    return null;
  }
}

export function PortfolioPage() {
  const portfolio = useLoaderData() as Portfolio | null;

  if (!portfolio) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Could not load portfolio.
      </div>
    );
  }

  const pnlNum = parseFloat(portfolio.pnl);
  const isPos = pnlNum >= 0;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">My Portfolio</h1>
        <p className="mt-2 text-muted-foreground">Your open positions and performance.</p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Wallet,
            label: 'Balance',
            value: `₳ ${portfolio.balance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`,
            color: 'text-foreground',
          },
          {
            icon: isPos ? TrendingUp : TrendingDown,
            label: 'Total P&L',
            value: `${isPos ? '+' : ''}₳ ${Math.abs(pnlNum).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`,
            color: isPos ? 'text-success' : 'text-destructive',
          },
          {
            icon: Target,
            label: 'Win Rate',
            value: `${portfolio.winRate}%`,
            color: 'text-primary',
          },
          {
            icon: TrendingUp,
            label: 'Open Positions',
            value: portfolio.open,
            color: 'text-foreground',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border/60 bg-gradient-card p-5"
          >
            <s.icon className="mb-3 h-5 w-5 text-primary" />
            <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </dt>
            <dd className={`mt-1 font-display text-2xl font-bold ${s.color}`}>{s.value}</dd>
          </div>
        ))}
      </div>

      {/* Positions table */}
      <div className="rounded-2xl border border-border/60 bg-gradient-card overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="font-semibold">Open Positions</h2>
        </div>

        {portfolio.positions.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            No open positions. Start trading!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 text-left font-mono">Market</th>
                  <th className="px-4 py-3 text-center font-mono">Side</th>
                  <th className="px-4 py-3 text-right font-mono">Entry</th>
                  <th className="px-4 py-3 text-right font-mono">Current</th>
                  <th className="px-4 py-3 text-right font-mono">Size</th>
                  <th className="px-6 py-3 text-right font-mono">P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {portfolio.positions.map((pos) => {
                  const posPnl = parseFloat(pos.pnl);
                  const posIsPos = posPnl >= 0;
                  return (
                    <tr key={pos.marketId} className="hover:bg-surface/40 transition">
                      <td className="max-w-[240px] truncate px-6 py-4 font-medium">
                        {pos.market}
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
                      <td className="px-4 py-4 text-right font-mono text-muted-foreground">
                        {Math.round(pos.entry * 100)}¢
                      </td>
                      <td className="px-4 py-4 text-right font-mono">
                        {Math.round(pos.current * 100)}¢
                      </td>
                      <td className="px-4 py-4 text-right font-mono">
                        ₳ {pos.size.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-mono font-semibold ${
                          posIsPos ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {posIsPos ? '+' : ''}₳ {Math.abs(posPnl).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
