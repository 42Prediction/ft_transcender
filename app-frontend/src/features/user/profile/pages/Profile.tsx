import { useLoaderData, useRouteLoaderData } from "react-router-dom";
import { ProfileHeader } from "../components/ProfileHeader";
import { WinLossChart } from "../components/WinLossChart";
import { PortfolioSection } from "../components/PortfolioSection";
import { BetHistory } from "../components/BetHistory";
import { ActivityInsights } from "../components/ActivityInsights";
import type { ProfileLoaderData } from "../route";


export default function ProfilePage() {
  const { bettor, stats, positions, portfolio } = useLoaderData() as ProfileLoaderData;

  const authUser = useRouteLoaderData('root') as any;

  const isAuthenticated = authUser?.success === true;
  const isOwn = isAuthenticated && authUser?.data?.nick === bettor?.nick;

  const pending = stats ? Math.max(stats.totalBets - stats.wins - stats.losses, 0) : 0;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-hero opacity-60" />
      <div className="relative">
        <main className="mx-auto max-w-[1400px] px-6 py-8 space-y-8">

          <ProfileHeader bettor={bettor} isOwn={isOwn} stats={stats} />

          {isOwn && portfolio && <PortfolioSection portfolio={portfolio} />}

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <BetHistory positions={positions} />
            <div className="space-y-6">
              <WinLossChart
                wins={stats?.wins ?? 0}
                losses={stats?.losses ?? 0}
                pending={pending}
              />
              {isOwn && <ActivityInsights />}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
