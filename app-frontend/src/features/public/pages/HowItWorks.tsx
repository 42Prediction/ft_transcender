import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";

export function HowItWorksPage() {
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
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">How It Works</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            The mechanics behind every market, from creation to payout.
          </p>

          <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                1. What is a prediction market?
              </h2>
              <p className="mt-3">
                A prediction market lets you bet on the outcome of a real, future event. Instead
                of betting against "the house," you're trading against other bettors — the price
                of YES and NO reflects what the community collectively believes is likely to
                happen. As new bets come in, the price moves in real time.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                2. Where do markets come from?
              </h2>
              <p className="mt-3">
                Markets on this platform are generated automatically from real 42 School data —
                one market per (exam, cadet) pulled from the 42 Intra API. A market like{" "}
                <em>"Will Marco pass Exam Rank 06?"</em> is created when the exam is scheduled,
                and closes when the exam window ends.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                3. How is the price set?
              </h2>
              <p className="mt-3">
                Every market starts at 50/50. Behind the scenes, each market holds a YES pool and
                a NO pool. When you buy YES, xp flows into the YES pool, and the price of YES
                rises — the more one side is bought, the more expensive it gets relative to the
                other. This is the same automated market maker (AMM) idea used by real prediction
                markets: the price is always just "how much of the pool is on each side."
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                4. Placing a bet
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>Open any market and pick a side — YES or NO.</li>
                <li>
                  Choose how much xp to wager. Your entry price is locked in at the moment you
                  bet, based on the pool's state right then.
                </li>
                <li>
                  Your bet becomes a <strong className="text-foreground">position</strong> —
                  visible on your profile until the market resolves.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                5. Resolution &amp; payout
              </h2>
              <p className="mt-3">
                When the real-world event concludes (the exam result comes in), an admin or
                moderator resolves the market as YES or NO. Everyone who bet on the winning side
                splits the pool proportionally to their stake — the payout lands straight in your
                wallet. If a market is cancelled instead (e.g. the cadet deregistered from the
                exam), every stake is refunded in full.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                6. Your wallet
              </h2>
              <p className="mt-3">
                Every account starts with a welcome bonus of xp, topped up by your real 42 cursus
                level, daily login streaks, and onboarding quests. xp is an internal, non-monetary
                currency — see the <Link to="/faq" className="text-primary hover:underline">FAQ</Link> for details.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
