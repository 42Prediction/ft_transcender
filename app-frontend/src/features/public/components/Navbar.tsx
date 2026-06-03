import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { bettor } from "../../../api/bettor/bettor.api";

import {
  Bell,
  Search,
  Wallet,
  ChevronDown,
  Sparkles,
  Settings,
  LogOut,
} from "lucide-react";

interface BettorProfile {
  id: number;
  nick: string;
  balance?: number;
  avatar?: string;
}

export default function Navbar() {
  const location = useLocation();
  const { logout } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<BettorProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    bettor.getMe().then(({ data }) => {
      setProfile(data);
    });
  }, []);

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

  const navLinks = [
    { name: "Markets", path: "/markets" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Portfolio", path: "/portfolio" },
    { name: "Activity", path: "/activity" },
    { name: "Learn", path: "/learn" },
  ];

  return (

    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/30 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-6">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Exam<span className="text-gradient-brand">Bet</span>
          </span>
          <span className="ml-2 hidden rounded-md border border-border/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline">42</span>
        </Link>

        {/* Navegação */}
        <nav className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`rounded-lg px-3 py-1.5 transition hover:bg-surface hover:text-foreground ${
                isActive(link.path) ? "bg-surface text-foreground" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Barra de Pesquisa */}
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

        {/* Notificações */}
        <button className="relative hidden h-10 w-10 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:text-foreground md:grid">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-glow" />
        </button>

        {/* Carteira */}
        <button className="hidden h-10 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary transition hover:bg-primary/20 md:flex">
          <Wallet className="h-4 w-4" />
          ₳ {profile?.balance?.toLocaleString("pt-PT", { minimumFractionDigits: 2 }) || "4,820.50"}
        </button>

        {/* Menu do Usuário */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setOpen(!open)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-brand px-4 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            <span className="hidden sm:inline">{profile?.nick || "lpiquet"}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>

          {/* Menu Dropdown - Também ajustado para bg-background/70 com efeito blur */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-border/60 bg-background/30 backdrop-blur-xl p-1.5 shadow-xl z-50">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
              
              <div className="my-1 border-t border-border/40" />

              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}