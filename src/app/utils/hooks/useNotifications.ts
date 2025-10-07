import { QueryObserverResult, useQuery } from 'react-query';
import { getUserNotifications } from '@/src/app/utils/services/notifications-service';
import { useNotificationsStore } from '@/src/app/utils/store/notificationsStore';
import { NotificationItem } from '@/src/app/utils/types/notification-types';

interface NotificationsData {
  notifications: NotificationItem[];
  hasNewNotifications: boolean;
  newNotificationsCount: number;
}

export const useNotificationsQuery = (): {
  data: NotificationsData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<QueryObserverResult<NotificationsData, Error>>;
} => {
  const { setNotifications } = useNotificationsStore();

  const query = useQuery<NotificationsData, Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await getUserNotifications();
      return {
        notifications: res.notifications,
        hasNewNotifications: res.newNotificationsCount > 0,
        newNotificationsCount: res.newNotificationsCount,
      };
    },
    onSuccess: async data => {
      setNotifications(data);
    },
    staleTime: 1000, // Shorter cache for debugging
    cacheTime: 1000,
    refetchOnWindowFocus: true,
    refetchInterval: false, // Disable auto-refetch during debugging
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
};
