export type Market = {
  id: string;
  student: string;
  handle: string;
  avatar: string;
  category: string;
  project: string;
  probability: number;
  volume: string;
  closes: string;
  status: "live" | "closing" | "new";
  yesPrice: number;
  noPrice: number;
};

export type Friend = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  campus: string;
  level: number;
  status: "online" | "offline" | "busy";
  since: string;
};

const avatarSeed = (s: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(s)}&backgroundType=gradientLinear`;

export const markets: Market[] = [
  { id: "m1", student: "Léa Moreau", handle: "lmoreau", avatar: avatarSeed("lmoreau"), category: "Common Core", project: "ft_transcendence — final defense", probability: 72, volume: "₳ 12,480", closes: "2d 14h", status: "live", yesPrice: 0.72, noPrice: 0.28 },
  { id: "m2", student: "Nelson Figueiredo", handle: "nfigueir", avatar: avatarSeed("nfigueir"), category: "Exams", project: "Exam Rank 06 — first attempt", probability: 41, volume: "₳ 8,210", closes: "18h 02m", status: "closing", yesPrice: 0.41, noPrice: 0.59 },
  { id: "m3", student: "Diego Alvarez", handle: "dalvarez", avatar: avatarSeed("dalvarez"), category: "Rushes", project: "Rush 02 — team passes", probability: 88, volume: "₳ 5,940", closes: "3d 04h", status: "live", yesPrice: 0.88, noPrice: 0.12 },
  { id: "m4", student: "Amelia Park", handle: "apark", avatar: avatarSeed("apark"), category: "Piscine", project: "Reaches Common Core (Aug C-piscine)", probability: 56, volume: "₳ 21,330", closes: "12d", status: "live", yesPrice: 0.56, noPrice: 0.44 },
  { id: "m5", student: "Omar Haddad", handle: "ohaddad", avatar: avatarSeed("ohaddad"), category: "Projects", project: "minishell — outstanding (>100)", probability: 33, volume: "₳ 3,712", closes: "5d 09h", status: "new", yesPrice: 0.33, noPrice: 0.67 },
  { id: "m6", student: "Ines Costa", handle: "icosta", avatar: avatarSeed("icosta"), category: "Internships", project: "Lands internship before milestone 4", probability: 64, volume: "₳ 9,805", closes: "21d", status: "live", yesPrice: 0.64, noPrice: 0.36 },
];

export const trending: Market[] = [markets[3], markets[0], markets[5], markets[1]];

export const categories = [
  { name: "All", count: 248 },
  { name: "Piscine", count: 42 },
  { name: "Common Core", count: 96 },
  { name: "Exams", count: 31 },
  { name: "Rushes", count: 18 },
  { name: "Projects", count: 47 },
  { name: "Internships", count: 9 },
  { name: "Peer Evals", count: 5 },
];

export const leaderboard = [
  { rank: 1, name: "kpetrov", level: 18.42, pnl: "+₳ 48,210", win: "78%", streak: 12 },
  { rank: 2, name: "msantos", level: 16.10, pnl: "+₳ 41,665", win: "74%", streak: 8 },
  { rank: 3, name: "jbernard", level: 17.88, pnl: "+₳ 38,902", win: "71%", streak: 5 },
  { rank: 4, name: "awalter", level: 15.30, pnl: "+₳ 32,114", win: "69%", streak: 3 },
  { rank: 5, name: "fzhang", level: 14.95, pnl: "+₳ 27,540", win: "67%", streak: 9 },
  { rank: 6, name: "rdubois", level: 13.60, pnl: "+₳ 22,008", win: "65%", streak: 2 },
];

export const activity = [
  { user: "kpetrov", action: "bought YES", amount: "₳ 320", market: "ft_transcendence final defense", time: "2m" },
  { user: "msantos", action: "bought NO", amount: "₳ 180", market: "Exam Rank 06 first attempt", time: "5m" },
  { user: "awalter", action: "resolved", amount: "+₳ 1,240", market: "philosophers — pass", time: "11m" },
  { user: "jbernard", action: "opened market", amount: "", market: "webserv — bonus tier", time: "22m" },
  { user: "fzhang", action: "bought YES", amount: "₳ 95", market: "Reaches Common Core (Aug)", time: "34m" },
];

export const portfolio = {
  balance: "₳ 4,820.50",
  pnl: "+12.4%",
  open: 8,
  resolved: 34,
  winRate: 68,
  positions: [
    { market: "ft_transcendence — final defense", side: "YES", entry: 0.62, current: 0.72, size: "₳ 420", pnl: "+₳ 67" },
    { market: "minishell — outstanding", side: "NO", entry: 0.71, current: 0.67, size: "₳ 210", pnl: "+₳ 12" },
    { market: "Exam Rank 06 — first attempt", side: "YES", entry: 0.48, current: 0.41, size: "₳ 300", pnl: "-₳ 21" },
  ],
};

export const friendsList: Friend[] = [
  { id: "f1", name: "Kirill Petrov", handle: "kpetrov", avatar: avatarSeed("kpetrov"), campus: "42 Moscow", level: 18, status: "online", since: "Mar 2024" },
  { id: "f2", name: "Maria Santos", handle: "msantos", avatar: avatarSeed("msantos"), campus: "42 Lisboa", level: 16, status: "busy", since: "Jan 2024" },
  { id: "f3", name: "Julien Bernard", handle: "jbernard", avatar: avatarSeed("jbernard"), campus: "42 Paris", level: 17, status: "offline", since: "Dec 2023" },
  { id: "f4", name: "Anna Walter", handle: "awalter", avatar: avatarSeed("awalter"), campus: "42 Berlin", level: 15, status: "online", since: "Feb 2024" },
  { id: "f5", name: "Fei Zhang", handle: "fzhang", avatar: avatarSeed("fzhang"), campus: "42 Singapore", level: 14, status: "offline", since: "Nov 2023" },
  { id: "f6", name: "Romain Dubois", handle: "rdubois", avatar: avatarSeed("rdubois"), campus: "42 Lyon", level: 13, status: "online", since: "Apr 2024" },
  { id: "f7", name: "Léa Moreau", handle: "lmoreau", avatar: avatarSeed("lmoreau"), campus: "42 Paris", level: 27, status: "busy", since: "Sep 2023" },
  { id: "f8", name: "Nelson Figueiredo", handle: "nfigueir", avatar: avatarSeed("nfigueir"), campus: "42 Tokyo", level: 22, status: "online", since: "Aug 2023" },
];
