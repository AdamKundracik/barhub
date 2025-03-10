import { create } from 'zustand';
import { QueryObserverResult, useQuery } from 'react-query';
import { useEffect } from 'react';
import {
  getUserNotifications,
  markAllNotificationsAsSeen,
} from '../services/notifications-service';
import { NotificationItem } from '../types/notification-types';

interface NotificationsResponse {
  notifications: NotificationItem[];
  hasNewNotifications: boolean;
  newNotificationsCount: number;
}

interface NotificationsState {
  data: NotificationsResponse | null;
  isLoading: boolean;
  isRefetching: boolean;
  lastUpdated: Date | null;
}

interface NotificationsActions {
  refetch: () => Promise<QueryObserverResult<NotificationsResponse, Error>>;
  setNotifications: (data: NotificationsResponse) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsSeen: () => Promise<void>;
  reset: () => void;
}

type NotificationsStore = NotificationsState & NotificationsActions;

const initialState: NotificationsState = {
  data: null,
  isLoading: false,
  isRefetching: false,
  lastUpdated: null,
};

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  ...initialState,

  refetch: async () => {
    const result = await getUserNotifications();
    return {
      status: 'success',
      data: {
        notifications: result.data.notifications,
        hasNewNotifications: result.data.newNotificationsCount > 0,
        newNotificationsCount: result.data.newNotificationsCount,
      },
      isSuccess: true,
      isError: false,
      isLoading: false,
      isIdle: false,
    } as QueryObserverResult<NotificationsResponse, Error>;
  },

  setNotifications: data => {
    set({
      data,
      lastUpdated: new Date(),
    });
  },

  markAsRead: notificationId => {
    const { data } = get();
    if (!data) return;

    const updatedNotifications = data.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
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
        const newData = await get().refetch();
        if (newData.data) {
          get().setNotifications(newData.data);
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
    }
  },

  reset: () => {
    set(initialState);
  },
}));

export const useNotifications = () => {
  const setNotifications = useNotificationsStore(
    state => state.setNotifications
  );

  const queryResult = useQuery<NotificationsResponse, Error>(
    'notifications',
    async () => {
      const result = await getUserNotifications();
      return {
        notifications: result.data.notifications,
        hasNewNotifications: result.data.newNotificationsCount > 0,
        newNotificationsCount: result.data.newNotificationsCount,
      };
    },
    {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      enabled: true,
      staleTime: 1000 * 60, // 1 minute
      refetchInterval: 1000 * 60, // 1 minute
      retry: 2,
      retryDelay: 1000,
      onSuccess: setNotifications,
      refetchIntervalInBackground: true,
    }
  );

  useEffect(() => {
    useNotificationsStore.setState({
      isLoading: queryResult.isLoading,
      isRefetching: queryResult.isRefetching,
      refetch: queryResult.refetch,
    });
  }, [queryResult.isLoading, queryResult.isRefetching, queryResult.refetch]);

  return queryResult;
};
