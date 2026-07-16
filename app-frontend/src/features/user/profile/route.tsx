import type { LoaderFunctionArgs } from "react-router-dom";
import ProfilePage from "./pages/Profile";
import { bettor } from "@/api/bettor/bettor.api";
import { marketApi, type BettorPosition, type BettorStats, type Portfolio } from "@/api/market/market.api";
import { dataContext } from "@/routes";


export interface Bettor {
  nick: string;
  bio: string;
  avatar: string | null;
  isNickSet?: boolean;
  campus: string;
  createdAt: string;
}

export interface ProfileLoaderData {
  bettor: Bettor;
  stats: BettorStats | null;
  positions: BettorPosition[];
  portfolio: Portfolio | null;
}

export async function publicProfileLoader({
  params,
  context,
}: LoaderFunctionArgs): Promise<ProfileLoaderData> {
  const nick = params.nick!;

  try {
    const me = context.get(dataContext);
    const isOwn = me?.data?.nick === nick;

    const [res, stats, positions, portfolio] = await Promise.all([
      bettor.getByNick(nick),
      marketApi.getBettorStats(nick).catch(() => null),
      marketApi.getBettorPositions(nick).catch(() => [] as BettorPosition[]),
      isOwn ? marketApi.getPortfolio().catch(() => null) : Promise.resolve(null),
    ]);

    return { bettor: res.data?.data as Bettor, stats, positions, portfolio };
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new Response("User not found", {
        status: 404,
      });
    }

    throw err;
  }
}

export const profileRoute = [
  {
    path: ':nick',
    Component: ProfilePage,
    loader: publicProfileLoader,
  }
];
