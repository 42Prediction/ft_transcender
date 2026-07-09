import { ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
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
              <Info className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">About</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Why we built a prediction market for exam results.
          </p>

          <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                The project
              </h2>
              <p className="mt-3">
                42 Prediction was built as a <code className="rounded bg-surface px-1.5 py-0.5 text-xs">ft_transcendence</code>{" "}
                project at 42 School. Instead of the traditional Pong-based scope, our team chose
                to build something that turns campus life itself into the game: a prediction
                market where you bet an internal currency on real events from the 42 ecosystem —
                exam results, project defenses, and cursus progress.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Why a prediction market?
              </h2>
              <p className="mt-3">
                Every cadet already tracks exam results and gossips about who's likely to pass —
                we just gave that instinct a real-time price feed, a wallet, and bragging rights.
                It let us build a genuinely full-stack product: live WebSocket pricing, an
                account/wallet system with real financial-style invariants, social features
                (friends, chat, notifications), and an admin/moderation layer — all in service of
                one coherent idea instead of a checklist of disconnected features.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Built by
              </h2>
              <p className="mt-3">
                A five-person team at 42, each owning a feature end-to-end across frontend and
                backend. Full technical write-up in the project's{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">README.md</code>.
              </p>

              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { name: "Adilson Jacinto", login: "ajacinto", role: "Product Owner" },
                  { name: "Nelson Matenda Figueiredo", login: "nfigueir", role: "Project Manager" },
                  { name: "Guilherme Santos", login: "gudos-sa", role: "Technical Lead" },
                  { name: "Marco Carvalho", login: "marccarv", role: "Developer" },
                  { name: "Albano Manuel", login: "almanuel", role: "Developer" },
                ].map((m) => (
                  <li
                    key={m.login}
                    className="rounded-xl border border-border/60 bg-surface/40 p-4"
                  >
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-primary">@{m.login}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.role}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Not affiliated with 42 Network
              </h2>
              <p className="mt-3">
                This is a student project built for and by the 42 community, using publicly
                available 42 Intra API data. It is not an official 42 Network product, and xp has
                no monetary value.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Get in touch
              </h2>
              <p className="mt-3">Questions, bugs, or feedback: geral@42prediction.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
