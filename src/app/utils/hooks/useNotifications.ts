import { QueryObserverResult, useQuery } from 'react-query';
import { getUserNotifications } from '@/src/app/utils/services/notifications-service';
import { useNotificationsStore } from '@/src/app/utils/store/notificationsStore';
import { NotificationItem } from '@/src/app/utils/types/notification-types';
import { useUserStore } from '@/src/app/utils/store/userStore';

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
  const userData = useUserStore(state => state.userData);
  
  // Check if user is authenticated - reactively updates when userData changes
  const isAuthenticated = !!userData?.id;

  console.log('[useNotificationsQuery] User authenticated:', isAuthenticated, 'User ID:', userData?.id);

  const query = useQuery<NotificationsData, Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      console.log('[useNotificationsQuery] queryFn called - fetching notifications');
      const res = await getUserNotifications();
      console.log('[useNotificationsQuery] queryFn completed - notifications count:', res.newNotificationsCount);
      return {
        notifications: res.notifications,
        hasNewNotifications: res.newNotificationsCount > 0,
        newNotificationsCount: res.newNotificationsCount,
      };
    },
    enabled: isAuthenticated, // Only fetch when user is authenticated
    retry: false, // Don't retry on error
    onSuccess: async data => {
      console.log('[useNotificationsQuery] onSuccess - setting notifications, count:', data.newNotificationsCount);
      setNotifications(data);
    },
    onError: (error) => {
      console.error('[useNotificationsQuery] onError:', error);
    },
    staleTime: 60000, // 1 minute cache
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false, // Don't auto-refetch - badge should stay until mark all as read
    refetchInterval: false,
  });

  console.log('[useNotificationsQuery] Query state - isLoading:', query.isLoading, 'isFetching:', query.isFetching, 'enabled:', isAuthenticated);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
};
