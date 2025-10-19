// notificationsStore.ts
import { create } from 'zustand';
import {
  getUserNotifications,
  markAllNotificationsAsSeen,
} from '../services/notifications-service';
import { NotificationItem } from '../types/notification-types';

export interface NotificationsResponse {
  notifications: NotificationItem[];
  hasNewNotifications: boolean;
  newNotificationsCount: number;
}

interface NotificationsState {
  data: NotificationsResponse | null;
}

interface NotificationsActions {
  setNotifications: (data: NotificationsResponse) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsSeen: () => Promise<void>;
  reset: () => void;
}

export const useNotificationsStore = create<
  NotificationsState & NotificationsActions
>((set, get) => ({
  data: null,

  setNotifications: data => {
    set({ data });
  },

  markAsRead: notificationId => {
    const data = get().data;
    if (!data) return;

    const updatedNotifications = data.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    const newCount = Math.max(0, data.newNotificationsCount - 1);

    set({
      data: {
        ...data,
        notifications: updatedNotifications,
        newNotificationsCount: newCount,
        hasNewNotifications: newCount > 0,
      },
    });
  },

  markAllAsSeen: async () => {
    try {
      const result = await markAllNotificationsAsSeen();
      if (result.success) {
        const res = await getUserNotifications();
        set({
          data: {
            notifications: res.notifications,
            newNotificationsCount: res.newNotificationsCount,
            hasNewNotifications: res.newNotificationsCount > 0,
          },
        });
      }
    } catch (error) {
      console.error('Error marking all as seen', error);
    }
  },

  reset: () => set({ data: null }),
}));
