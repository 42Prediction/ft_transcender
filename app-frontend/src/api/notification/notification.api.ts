import api from '../api';

export type NotificationType =
  | 'bet_resolved'
  | 'bet_cancelled'
  | 'chat_mention'
  | 'friend_request_received'
  | 'friend_request_accepted';

export interface AppNotification {
  id: string;
  bettorId: string;
  type: NotificationType;
  marketId: string | null;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unread: number;
}

function unwrap<T>(res: any): T {
  return res.data?.data as T;
}

export const notificationApi = {
  list: async (): Promise<NotificationList> => {
    const res = await api.get('/notifications');
    return unwrap<NotificationList>(res);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },
};
