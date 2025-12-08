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
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<NotificationsData, Error>>;
} => {
  const { setNotifications, data: storeData } = useNotificationsStore();
  const userData = useUserStore(state => state.userData);
  
  // Check if user is authenticated - reactively updates when userData changes
  const isAuthenticated = !!userData?.id;

  console.log('[useNotificationsQuery] User authenticated:', isAuthenticated, 'User ID:', userData?.id);

  const query = useQuery<NotificationsData, Error>({
    queryKey: ['notifications', userData?.id], // Include user ID in query key for proper cache invalidation
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
    retry: 1, // Retry once on error
    retryDelay: 1000, // Wait 1 second before retry
    onSuccess: async data => {
      console.log('[useNotificationsQuery] onSuccess - setting notifications, count:', data.newNotificationsCount);
      // Always set notifications to store, even if empty
      setNotifications(data);
    },
    onError: (error) => {
      console.error('[useNotificationsQuery] onError:', error);
      // Set empty notifications on error to prevent infinite loading
      setNotifications({
        notifications: [],
        hasNewNotifications: false,
        newNotificationsCount: 0,
      });
    },
    staleTime: 60000, // 1 minute cache
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false, // Don't auto-refetch - badge should stay until mark all as read
    refetchInterval: false,
    // Use cached data if available while refetching
    keepPreviousData: true,
  });

  console.log('[useNotificationsQuery] Query state - isLoading:', query.isLoading, 'isFetching:', query.isFetching, 'isError:', query.isError, 'enabled:', isAuthenticated);

  // If query is disabled (not authenticated), return empty data from store or create empty state
  if (!isAuthenticated) {
    return {
      data: storeData ?? undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: query.refetch,
    };
  }

  return {
    data: query.data || (storeData ?? undefined), // Fallback to store data if query data is not available yet
    isLoading: query.isLoading && !storeData, // Only show loading if we don't have cached data
    isFetching: query.isFetching,
    isError: query.isError || false,
    error: query.error || null,
    refetch: query.refetch,
  };
};
