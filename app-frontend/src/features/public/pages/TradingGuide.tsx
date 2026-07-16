import { ArrowLeft, LineChart } from "lucide-react";
import { Link } from "react-router-dom";

export function TradingGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-8 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
              <LineChart className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Trading Guide</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Reading the market, sizing your bets, and understanding your P&amp;L.
          </p>

          <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Reading the price as a probability
              </h2>
              <p className="mt-3">
                A YES price of 72% means the market currently thinks there's a 72% chance the
                event happens — not that the outcome is 72% "true". If you believe the real
                probability is higher than the market price, YES is a good bet; if you believe
                it's lower, NO is. Prices update live as other bettors trade, exactly like a
                stock's price moves with buy/sell pressure.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Entry price, shares, and payout
              </h2>
              <p className="mt-3">
                When you bet, your xp buys <strong className="text-foreground">shares</strong> at
                the current price — e.g. betting 50xp at a 40% YES price buys you 125 shares. If
                the market resolves YES, each winning share pays out 1xp, so that position would
                return 125xp (a 75xp profit). The earlier you bet on a side that ends up correct,
                the better your price and the higher your payout multiple — this is the core
                trade-off of prediction markets.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Watch the clock
              </h2>
              <p className="mt-3">
                Every market has a closing time tied to the real exam window. A market in{" "}
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                  closing
                </span>{" "}
                status is less than 24h from close — prices tend to become more decisive (closer
                to 0% or 100%) as new information becomes available. Once a market closes, no more
                bets are accepted; it stays open only for resolution.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Sizing your bets
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Don't put your whole balance into one market — spread risk across several.</li>
                <li>
                  A large bet moves the pool more, worsening your own average entry price — the
                  market shows you the price impact before you confirm.
                </li>
                <li>
                  Track open positions and resolved P&amp;L on your{" "} profile page — the Win/Loss
                  chart and "My Activity" card summarize your track record.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Risk disclaimer
              </h2>
              <p className="mt-3">
                xp is an internal, non-monetary currency with no cash value and cannot be
                withdrawn or exchanged. Nothing here is financial advice — it's a game built
                around real 42 School outcomes, for the 42 community, for fun and bragging rights.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
