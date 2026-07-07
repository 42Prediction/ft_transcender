import { auth } from "@/api/auth/auth.api";
import Logo from "@/components/Logo";
import { Bell, ChevronDown, LogOut, Menu, Plus, Settings, Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useRevalidator, useRouteLoaderData } from "react-router-dom";
import { CreateMarketModal } from "@/features/market/components/CreateMarketModal";
import { SearchBox } from "./SearchBox";


export function Navbar() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const data = useRouteLoaderData('root') as any;
  const profile = data?.data;
  // GET /bettor/me nests the account under `.user` — role lives at
  // profile.user.role, not profile.role.
  const isAdmin = profile?.user?.role === 'admin';
  const location = useLocation();
  const from = location;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [createMarketOpen, setCreateMarketOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative h-15 w-15">
            <Logo />
          </div>
          <span className="font-display text-xl text-brand font-bold tracking-tight">
            Prediction
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
          <Link to="/markets" className="rounded-lg px-3 py-1.5 transition hover:bg-surface hover:text-foreground">Markets</Link>
          <Link to="/leaderboard" className="rounded-lg px-3 py-1.5 transition hover:bg-surface hover:text-foreground">Leaderboard</Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center gap-3 lg:flex-initial">
        {
          profile && 
          <SearchBox />
        }
        </div>
        {isAdmin && (
        <button
          onClick={() => setCreateMarketOpen(true)}
          className="hidden h-10 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary transition hover:bg-primary/20 md:flex"
        >
          <Plus className="h-4 w-4" />
          New Market
        </button>
      )}
      {profile ? UserInfo(profile, dropdownRef, setOpen, open, auth.signout, revalidator, navigate) : SignButtons(from)}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:text-foreground lg:hidden"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      <CreateMarketModal open={createMarketOpen} onOpenChange={setCreateMarketOpen} />
      </div>

      {mobileOpen && (
        <nav className="border-t border-border/40 px-6 py-3 lg:hidden">
          <div className="flex flex-col gap-1 text-sm">
            <Link to="/markets" className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-surface hover:text-foreground">Markets</Link>
            <Link to="/leaderboard" className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-surface hover:text-foreground">Leaderboard</Link>
            {isAdmin && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setCreateMarketOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-primary transition hover:bg-primary/10 md:hidden"
              >
                <Plus className="h-4 w-4" />
                New Market
              </button>
            )}
            {profile ? (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-primary md:hidden">
                <Wallet className="h-4 w-4" />
                ₳ {profile?.wallet?.balance?.toLocaleString("pt-PT", { minimumFractionDigits: 2 }) || "0.00"}
              </div>
            ) : (
              <Link
                to="/signin"
                state={{ backgroundLocation: from }}
                className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-surface hover:text-foreground md:hidden"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function SignButtons(from: any) {
  return (
    <>
      <Link
        to="/signin"
        state={{ backgroundLocation: from }}
        className="hidden h-10 items-center gap-2 rounded-xl border border-border/60 bg-surface px-4 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary md:flex"
      >
        Sign In
      </Link>

      <Link
        to="/signup"
        state={{ backgroundLocation: from }}
        className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-80"
      >
        <span>Sign Up</span>
      </Link>
    </>
  )
}

function UserInfo(
  profile: any | null,
  dropdownRef: React.RefObject<HTMLDivElement | null>,
  setOpen: (value: boolean) => void,
  open: boolean,
  signout: () => Promise<{ message: string }>,
  revalidator: ReturnType<typeof useRevalidator>,
  navigate: ReturnType<typeof useNavigate>
) {
  return (
    <>
    <button className="relative hidden h-10 w-10 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:text-foreground md:grid">
      <Bell className="h-4 w-4" />
      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-glow" />
    </button>

    <div className="relative" ref={dropdownRef}>
      </div>
      <button className="hidden h-10 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary transition hover:bg-primary/20 md:flex">
      <Wallet className="h-4 w-4" />
      ₳ {profile?.wallet?.balance?.toLocaleString("pt-PT", { minimumFractionDigits: 2 }) || "4,820.50"}
    </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
        >
          <span className="hidden sm:inline">{profile?.nick}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-border/60 bg-background backdrop-blur-xl p-1.5 shadow-xl z-50">
            <div className="flex items-center gap-1">
              <Link
                to={`user/${profile?.nick}`}
                onClick={() => setOpen(false)}
                className=" flex-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                <span>{profile?.nick}</span>
              </Link>
              <Link to="user/settings"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
            <div className="my-1 border-t border-border/40" />

            <button
              onClick={async () => {
                setOpen(false);
                await signout();
                await revalidator.revalidate();
                navigate('/', { replace: true });
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  )
}
