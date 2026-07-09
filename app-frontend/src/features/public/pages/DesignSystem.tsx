import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  ChevronLeft,
  Download,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COLOR_TOKENS: { name: string; var: string }[] = [
  { name: "Primary", var: "--primary" },
  { name: "Accent", var: "--accent" },
  { name: "Success", var: "--success" },
  { name: "Warning", var: "--warning" },
  { name: "Destructive", var: "--destructive" },
  { name: "Yes", var: "--yes" },
  { name: "No", var: "--no" },
  { name: "Background", var: "--background" },
  { name: "Surface", var: "--surface" },
  { name: "Foreground", var: "--foreground" },
  { name: "Muted foreground", var: "--muted-foreground" },
  { name: "Border", var: "--border" },
];

const ICONS = [Bell, Search, Download, TrendingUp, ShieldCheck, Users, Calendar, Trash2];

const COMPONENT_CATALOG: { name: string; path: string; description: string }[] = [
  { name: "MarketCard", path: "features/public/components/MarketCard.tsx", description: "Probability bar, YES/NO buttons, avatar fallback — used on Home, Markets, Trending." },
  { name: "WinLossChart", path: "features/user/profile/components/WinLossChart.tsx", description: "Donut chart + legend pattern, reused across profile and analytics cards." },
  { name: "ActivityInsights", path: "features/user/profile/components/ActivityInsights.tsx", description: "Personal analytics card (area chart + stat row) on the profile page." },
  { name: "NotificationsBell", path: "features/user/notifications/NotificationsBell.tsx", description: "Bell icon with unread badge, dropdown inbox, real-time push via WebSocket." },
  { name: "CreateMarketModal", path: "features/market/components/CreateMarketModal.tsx", description: "Dialog-based form for admin market creation." },
  { name: "BetModal", path: "features/market/components/BetModal.tsx", description: "YES/NO amount entry dialog, shared by every market surface." },
  { name: "MarketChat", path: "features/market/components/MarketChat.tsx", description: "Per-market real-time chat panel over the shared WebSocket." },
  { name: "RewardsMenu", path: "features/user/engagement/RewardsMenu.tsx", description: "Daily bonus + quests popover, reused in the navbar." },
  { name: "Navbar / Footer", path: "features/public/components/{Navbar,Footer}.tsx", description: "Global chrome, present on every public route." },
  { name: "Dialog", path: "components/ui/dialog.tsx", description: "Radix-based modal primitive underlying every modal in the app." },
  { name: "Button", path: "components/ui/button.tsx", description: "cva-driven variants (default/outline/secondary/ghost/destructive/link) × 8 sizes." },
  { name: "ProfileCard", path: "components/ProfileCard.tsx", description: "Compact bettor identity card (avatar + nick + campus)." },
];

function useCssVar(name: string): string {
  const [value, setValue] = useState("");
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    setValue(v);
  }, [name]);
  return value;
}

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  const value = useCssVar(cssVar);
  return (
    <div className="rounded-xl border border-border/60 bg-surface p-3">
      <div
        className="h-14 w-full rounded-lg border border-border/40"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <p className="mt-2 text-xs font-medium text-foreground">{name}</p>
      <p className="font-mono text-[10px] text-muted-foreground">{cssVar}</p>
      {value && <p className="truncate font-mono text-[10px] text-muted-foreground" title={value}>{value}</p>}
    </div>
  );
}

export function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <a
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Home
      </a>

      <h1 className="font-display text-3xl font-bold">Design System</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Living reference for the tokens and reusable components behind every screen —
        color palette, typography, icon set, and a catalog of the {COMPONENT_CATALOG.length + 2}+
        components built once and reused everywhere.
      </p>

      {/* Colors */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Color palette</h2>
        <p className="text-sm text-muted-foreground">
          Read live from the current theme's CSS custom properties (adapts automatically if the
          palette changes).
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {COLOR_TOKENS.map((t) => (
            <Swatch key={t.var} name={t.name} cssVar={t.var} />
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Typography</h2>
        <div className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-card">
          <div>
            <p className="font-display text-3xl">Space Grotesk — Display / headings</p>
            <p className="font-mono text-xs text-muted-foreground">--font-display</p>
          </div>
          <div>
            <p className="font-sans text-lg">Geist Variable — Body text and UI</p>
            <p className="font-mono text-xs text-muted-foreground">--font-sans</p>
          </div>
          <div>
            <p className="font-mono text-lg">JetBrains Mono — Numbers, prices, data</p>
            <p className="font-mono text-xs text-muted-foreground">--font-mono</p>
          </div>
        </div>
      </section>

      {/* Icons */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Icons</h2>
        <p className="text-sm text-muted-foreground">lucide-react, used consistently at h-4 w-4 in UI chrome.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {ICONS.map((Icon, i) => (
            <div
              key={i}
              className="grid h-12 w-12 place-items-center rounded-xl border border-border/60 bg-surface text-foreground"
            >
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Buttons</h2>
        <p className="text-sm text-muted-foreground">All 6 variants of the shared Button component.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="default">Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button variant="default" size="icon">
            <Loader2 className="h-4 w-4 animate-spin" />
          </Button>
        </div>
      </section>

      {/* Component catalog */}
      <section className="mt-10 mb-16">
        <h2 className="font-display text-xl font-semibold">Reusable components</h2>
        <p className="text-sm text-muted-foreground">
          Built once, reused across the app — {COMPONENT_CATALOG.length} cataloged here.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {COMPONENT_CATALOG.map((c) => (
            <div key={c.name} className="rounded-xl border border-border/60 bg-surface p-4">
              <p className="text-sm font-semibold text-foreground">{c.name}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{c.path}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
