import Logo from "@/components/Logo";
import { AuthModal } from "@/features/auth/components/AuthModal";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  const openAuth = (tab: "signin" | "signup") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="relative h-15 w-15">
            <Logo/>
          </div>
          <span className="font-display text-xl text-brand font-bold tracking-tight">
           Prediction
          </span>
        </a>

        <nav className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
          <Link to="/" className="rounded-lg px-3 py-1.5 transition hover:bg-surface hover:text-foreground">Markets</Link>
          <Link to="/Leaderboard" className="rounded-lg px-3 py-1.5 transition hover:bg-surface hover:text-foreground">Leaderboard</Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center gap-3 lg:flex-initial">
          <div className="relative flex-1 lg:w-80 lg:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search students, projects, exams…"
              className="h-10 w-full rounded-xl border border-border/60 bg-surface pl-10 pr-12 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:block">⌘K</kbd>
          </div>
        </div>

        <button
          onClick={() => openAuth("signin")}
          className="hidden h-10 items-center gap-2 rounded-xl border border-border/60 bg-surface px-4 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary md:flex"
        >
          Sign In
        </button>

        <button
          onClick={() => openAuth("signup")}
          className="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-80"
        >
          <span className="hidden sm:inline">Sign Up</span>
        </button>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </header>
  );
}
