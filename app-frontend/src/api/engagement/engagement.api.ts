import api from '../api';

export interface DailyBonusStatus {
  canClaim: boolean;
  streak: number;
  /** xp the next claim would grant; null once already claimed today. */
  nextReward: number | null;
  nextStreak: number;
}

export interface DailyBonusClaim {
  claimed: boolean;
  reward: number;
  streak: number;
}

export interface Quest {
  key: string;
  title: string;
  description: string;
  reward: number;
  met: boolean;
  claimed: boolean;
}

export interface QuestList {
  quests: Quest[];
  claimableTotal: number;
}

export interface QuestClaim {
  claimed: { key: string; title: string; reward: number }[];
  total: number;
}

function unwrap<T>(res: any): T {
  return res.data?.data as T;
}

export const engagementApi = {
  getDailyStatus: async (): Promise<DailyBonusStatus> => {
    const res = await api.get('/engagement/daily');
    return unwrap<DailyBonusStatus>(res);
  },

  claimDaily: async (): Promise<DailyBonusClaim> => {
    const res = await api.post('/engagement/daily/claim');
    return unwrap<DailyBonusClaim>(res);
  },

  getQuests: async (): Promise<QuestList> => {
    const res = await api.get('/engagement/quests');
    return unwrap<QuestList>(res);
  },

  claimQuests: async (): Promise<QuestClaim> => {
    const res = await api.post('/engagement/quests/claim');
    return unwrap<QuestClaim>(res);
  },
};
