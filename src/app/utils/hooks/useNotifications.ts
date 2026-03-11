import { QueryObserverResult, useQuery } from 'react-query';
import { getUserNotifications } from '@/src/app/utils/services/notifications-service';
import { useNotificationsStore } from '@/src/app/utils/store/notificationsStore';
import { NotificationItem } from '@/src/app/utils/types/notification-types';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useAuth } from '@/src/app/providers/AuthProvider';

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
  const { isAuthenticated } = useAuth(); // Use auth state from AuthProvider (token-based)

  const query = useQuery<NotificationsData, Error>({
    queryKey: ['notifications', userData?.id], // Include user ID in query key for proper cache invalidation
    queryFn: async () => {
      const res = await getUserNotifications();
      return {
        notifications: res.notifications,
        hasNewNotifications: res.newNotificationsCount > 0,
        newNotificationsCount: res.newNotificationsCount,
      };
    },
    enabled: isAuthenticated, // Only fetch when user is authenticated
    retryDelay: 1000, // Wait 1 second before retry
    onSuccess: async data => {
      // Always set notifications to store, even if empty
      setNotifications(data);
    },
    onError: error => {
      console.error('[useNotificationsQuery] onError:', error);
      // Set empty notifications on error to prevent infinite loading
      setNotifications({
        notifications: [],
        hasNewNotifications: false,
        newNotificationsCount: 0,
      });
    },
    staleTime: 60000, // 1 minute - notifications don't change that frequently
    cacheTime: 600000, // 10 minutes - keep in memory longer
    refetchOnWindowFocus: false, // Don't auto-refetch - badge should stay until mark all as read
    refetchInterval: false,
    // Use cached data if available while refetching
    keepPreviousData: true,
    // Refetch on mount only if data is stale (respects staleTime)
    refetchOnMount: true,
    // Retry configuration for better reliability
    retry: (failureCount, error) => {
      // Don't retry auth errors, but retry network errors up to 2 times
      if (error?.message?.includes('not authenticated')) return false;
      return failureCount < 2;
    },
  });

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
