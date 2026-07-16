import { useCallback, useEffect, useState } from 'react';
import { getMarketSocket } from '@/lib/socket';
import { notificationApi, type AppNotification } from '@/api/notification/notification.api';

const LIST_LIMIT = 30;


export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await notificationApi.list();
      setItems(data.items);
      setUnread(data.unread);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setUnread(0);
      return;
    }
    void refresh();

    const socket = getMarketSocket();
    const handleNew = (notif: AppNotification) => {
      setItems((prev) => [notif, ...prev].slice(0, LIST_LIMIT));
      setUnread((n) => n + 1);
    };
    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [enabled, refresh]);

  const markAllRead = useCallback(async () => {
    if (unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      void refresh();
    }
  }, [unread, refresh]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.isRead) setUnread((u) => Math.max(0, u - 1));
      return prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    });
    try {
      await notificationApi.markRead(id);
    } catch {
    }
  }, []);

  return { items, unread, loading, refresh, markAllRead, markRead };
}
