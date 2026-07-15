import { useCallback, useEffect, useState } from 'react';
import { useRevalidator } from 'react-router-dom';
import { engagementApi, type QuestList } from '@/api/engagement/engagement.api';

export function useQuests() {
  const [data, setData] = useState<QuestList | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const revalidator = useRevalidator();

  const load = useCallback(async () => {
    try {
      setData(await engagementApi.getQuests());
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
      await engagementApi.claimQuests();
      await load();
      revalidator.revalidate(); 
    } catch {
      await load();
    } finally {
      setClaiming(false);
    }
  }, [claiming, load, revalidator]);

  return { data, loading, claiming, claim };
}
