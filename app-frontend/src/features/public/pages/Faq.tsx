import { ArrowLeft, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is xp?",
    a: "xp is the platform's internal currency, used to place bets and shown on your wallet balance. It has no cash value, can't be withdrawn, and can't be exchanged for real money — it exists purely to keep score.",
  },
  {
    q: "Is this real money? Is this gambling?",
    a: "No. xp is a non-monetary in-app currency awarded for signing up, your real 42 cursus progress, daily logins, and quests. There is no way to deposit real money or cash xp out.",
  },
  {
    q: "How do I get more xp?",
    a: "Every account starts with a welcome bonus based on your 42 cursus level. On top of that, you earn xp from daily login streaks and one-off onboarding quests — check the rewards menu in the navbar.",
  },
  {
    q: "Where do markets come from?",
    a: "Markets are generated automatically from real 42 School exam data via the 42 Intra API — one market per (exam, cadet). See How It Works for the full mechanics.",
  },
  {
    q: "Can I cancel or edit a bet after placing it?",
    a: "No — a bet locks in your entry price the moment it's placed, the same way a real trade would. You can always place additional bets on the opposite side if your view changes.",
  },
  {
    q: "What happens if a market is cancelled?",
    a: "If the underlying exam is voided — for example, the cadet deregisters before it ends — the market is cancelled and every stake on it is refunded in full, with no fees.",
  },
  {
    q: "What's the difference between User, Moderator and Admin?",
    a: (
      <>
        <strong className="text-foreground">Users</strong> can bet, chat, and manage their own
        profile/friends.{" "}
        <strong className="text-foreground">Moderators</strong> additionally resolve and cancel
        markets, and can view the user list. <strong className="text-foreground">Admins</strong>{" "}
        have full control, including creating markets, managing users, and promoting/demoting
        moderators.
      </>
    ),
  },
  {
    q: "Is my data safe? Can I export or delete it?",
    a: (
      <>
        Yes — from Settings → Account you can download a full JSON export of everything the
        platform holds about your account (profile, wallet ledger, bet history), or delete your
        account entirely. See our{" "}
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>{" "}
        for details.
      </>
    ),
  },
  {
    q: "Who can I contact for support?",
    a: "Reach out at geral@42prediction.com, or ping the team directly if you're on the 42 campus.",
  },
];

export function FaqPage() {
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
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything new bettors ask us in their first week.
          </p>

          <div className="mt-10 space-y-8">
            {FAQS.map((item) => (
              <div key={item.q} className="rounded-2xl border border-border/60 bg-surface/40 p-5">
                <h2 className="font-display text-base font-semibold text-foreground">{item.q}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
