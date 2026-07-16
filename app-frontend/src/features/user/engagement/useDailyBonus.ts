import { useCallback, useEffect, useState } from 'react';
import { useRevalidator } from 'react-router-dom';
import { engagementApi, type DailyBonusStatus } from '@/api/engagement/engagement.api';

export function useDailyBonus() {
  const [status, setStatus] = useState<DailyBonusStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState<{ reward: number; streak: number } | null>(null);
  const revalidator = useRevalidator();

  const load = useCallback(async () => {
    try {
      setStatus(await engagementApi.getDailyStatus());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const claim = useCallback(async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await engagementApi.claimDaily();
      setJustClaimed({ reward: res.reward, streak: res.streak });
      await load();
     
      revalidator.revalidate();
    } catch {
    
      await load();
    } finally {
      setClaiming(false);
    }
  }, [claiming, load, revalidator]);

  return { status, loading, claiming, justClaimed, claim };
}
