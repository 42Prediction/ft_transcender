import { Home } from './pages/Home';
import { PrivacyPage } from './pages/Privacy';
import { TermsPage } from './pages/Terms';
import { Markets, marketsLoader } from './pages/Markets';
import { Leaderboard, leaderboardLoader } from './pages/Leaderboard';
import { MarketDetail, marketDetailLoader } from './pages/MarketDetail';
import { marketApi } from '@/api/market/market.api';

async function homeLoader() {
  try {
    const [trending, stats] = await Promise.all([
      marketApi.getTrending(4),
      marketApi.getStats(),
    ]);
    return { trending, stats };
  } catch {
    return { trending: [], stats: null };
  }
}

export const publicRouter = [
  {
    index: true,
    id: 'home',
    Component: Home,
    loader: homeLoader,
  },
  {
    path: '/markets',
    Component: Markets,
    loader: marketsLoader,
  },
  {
    path: '/leaderboard',
    Component: Leaderboard,
    loader: leaderboardLoader,
  },
  {
    path: '/market/:id',
    Component: MarketDetail,
    loader: marketDetailLoader,
  },
  {
    path: '/privacy',
    Component: PrivacyPage,
  },
  {
    path: '/terms',
    Component: TermsPage,
  },
];
