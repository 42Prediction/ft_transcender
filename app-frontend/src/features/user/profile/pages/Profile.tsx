import { useLoaderData, useParams, useRouteLoaderData } from "react-router-dom";
import { ProfileHeader } from "../components/ProfileHeader";
import { StatsRow } from "../components/StatsRow";
import { AccuracyChart } from "../components/AccuracyChart";
import { WinLossChart } from "../components/WinLossChart";
import { ActivePredictions } from "../components/ActivePredictions";
import { HistoryTable } from "../components/HistoryTable";
import { ReputationCard } from "../components/ReputationCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { TopPerformances } from "../components/Topperformances";
import type { Bettor } from "../route";

export default function ProfilePage() {

  const bettor = useLoaderData() as Bettor;

  const authUser = useRouteLoaderData('root') as any;
  const isAuthenticated = authUser?.success === true;
  const isOwn = isAuthenticated && authUser?.data.nick === bettor?.nick;
  console.log('isOwn: ', isOwn);
  console.log('auth: ', isAuthenticated);
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-hero opacity-60" />
      <div className="relative">
        <main className="mx-auto max-w-[1400px] px-6 py-8 space-y-8">

          <ProfileHeader bettor={bettor} isOwn={isOwn} />

          <StatsRow />

          <div className="grid gap-6 lg:grid-cols-3">
            <AccuracyChart />
            <WinLossChart />
          </div>

          <ActivePredictions />

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <HistoryTable />
            <aside className="space-y-6">
              <ReputationCard />
              <ActivityFeed />
            </aside>
          </div>

          <TopPerformances />

        </main>
      </div>
    </div>
  );
}
