import { useState } from "react";
import {
  User,
  Wallet,
  TrendingUp,
  Bell,
  KeyRound,
} from "lucide-react";
import { PerfilPanel } from "../components/PerfilPanel";
import { PlaceholderPanel } from "../components/PlaceholderPanel";
import { SecurityPanel } from "../components/SecurityPanel";
import { AccountPanel } from "../components/AccountPanel";
import { useRouteLoaderData } from "react-router-dom";


type TabKey = "profile" | "account" | "negotiation" | "notifications" | "api";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "account", label: "Account", icon: Wallet },
  { key: "negotiation", label: "Negotiation", icon: TrendingUp },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "api", label: "API Keys", icon: KeyRound },
];


export function SettingsPage() {
  const [active, setActive] = useState<TabKey>("profile");
  const data = useRouteLoaderData('root');
  const bettor = data?.data;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
          <aside className="min-w-0">
            <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = active === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActive(t.key)}
                    className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition ${isActive
                      ? "bg-surface text-foreground"
                      : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
            {active === "profile" && <PerfilPanel bettor={bettor} />}
            {active === "account" && <SecurityPanel isTwoFactorEnabled={bettor?.user?.isTwoFactorEnabled ?? false} />}
            {active === "account" && <AccountPanel />}
            {active === "negotiation" && <PlaceholderPanel title="Negotiation" />}
            {active === "notifications" && <PlaceholderPanel title="Notifications" />}
            {active === "api" && <PlaceholderPanel title="API Keys" />}
          </section>
        </div>
      </main>
    </div>
  );
}
