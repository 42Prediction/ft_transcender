// import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  Wallet,
  TrendingUp,
  Bell,
  KeyRound,
  Code2,
} from "lucide-react";
import { PerfilPanel } from "../components/PerfilPanel";
import { PlaceholderPanel } from "../components/PlaceholderPanel";
import { ListaAmigos } from "../components/ListaAmigos";
import { useRouteLoaderData } from "react-router-dom";

// export const Route = createFileRoute("/settings")({
//   head: () => ({
//     meta: [
//       { title: "Configurações — ExamBet" },
//       { name: "description", content: "Gerencie seu perfil, conta e preferências." },
//     ],
//   }),
//   component: SettingsPage,
// });

type TabKey = "perfil" | "conta" | "negociacao" | "notificacoes" | "api" | "Amigos";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "conta", label: "Conta", icon: Wallet },
  { key: "negociacao", label: "Negociação", icon: TrendingUp },
  { key: "notificacoes", label: "Notificações", icon: Bell },
  { key: "api", label: "Chaves API do Relayer", icon: KeyRound },
  { key: "Amigos", label: "Amigos", icon: Code2 },
];


export function SettingsPage() {
  const [active, setActive] = useState<TabKey>("perfil");
  const data = useRouteLoaderData('root');
  const bettor = data.data;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside>
            <nav className="flex flex-col gap-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = active === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActive(t.key)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive
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

          <section>
            {active === "perfil" && <PerfilPanel bettor={bettor} />}
            {active === "conta" && <PlaceholderPanel title="Conta" />}
            {active === "negociacao" && <PlaceholderPanel title="Negociação" />}
            {active === "notificacoes" && <PlaceholderPanel title="Notificações" />}
            {active === "api" && <PlaceholderPanel title="Chaves API do Relayer" />}
            {active === "Amigos" && <ListaAmigos bettor={bettor} />}
          </section>
        </div>
      </main>
    </div>
  );
}
