import { useMemo, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { handleFreshContent } from '../../functions/posts-functions';
import { useFiltersStore } from '../../store/filtersStorage';
import { useLocationStore } from '../../store/locationStore';
import { usePlaceStore } from '../../store/placesStore';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { useUserStore } from '../../store/userStore';

export const useNewsFeedData = () => {
  const { distance, selectedPlaces, selectedOccupancy, showHighlightedPosts } =
    useFiltersStore();
  const { location, fakeLocation, useFakeLocation } = useLocationStore();
  const { placeId } = usePlaceStore();
  const { isAuthenticated } = useAuth();
  const userId = useUserStore(state => state.getUserId());
  const queryClient = useQueryClient();

  const currentLocation = useFakeLocation ? fakeLocation : location;

  // Round GPS coordinates to 4 decimal places (~11 meters precision)
  // This prevents query key from changing on tiny location updates
  const roundedLat = currentLocation?.latitude
    ? Math.round(currentLocation.latitude * 10000) / 10000
    : null;
  const roundedLong = currentLocation?.longitude
    ? Math.round(currentLocation.longitude * 10000) / 10000
    : null;

  const queryKey = placeId
    ? [
        'posts',
        placeId,
        roundedLat,
        roundedLong,
        distance,
        selectedPlaces,
        selectedOccupancy,
      ]
    : [
        'posts',
        roundedLat,
        roundedLong,
        distance,
        selectedPlaces,
        selectedOccupancy,
      ];

  const {
    data: postsData,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    queryKey,
    ({ pageParam = null }) => {
      return handleFreshContent(
        distance,
        pageParam,
        placeId,
        currentLocation!,
        selectedPlaces.length > 0 ? selectedPlaces : undefined,
        selectedOccupancy.length > 0 ? selectedOccupancy : undefined
      );
    },
    {
      getNextPageParam: lastPage => lastPage?.lastVisible || null, // lastVisible is mapped from nextCursor
      enabled: !!currentLocation && isAuthenticated && !!userId, // Wait for location, authentication, and userId to be available
      refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
      refetchOnMount: 'always', // Always refetch on mount for fresh data after app refresh
      staleTime: 30 * 1000, // 30 seconds - shorter for fresher data
      cacheTime: 5 * 60 * 1000, // 5 minutes - shorter cache time
      refetchInterval: false, // DISABLED: Prevent automatic refetching that can cause refresh loops
      refetchOnReconnect: true, // Refetch when network reconnects
    }
  );

  const prevIsRefetchingRef = useRef(false);
  useEffect(() => {
    prevIsRefetchingRef.current = isRefetching;
  }, [isRefetching]);

  const wrappedRefetch = useMemo(() => {
    return () => refetch();
  }, [refetch]);

  // Vytvoríme stabilný string z IDs pre memoizáciu
  const postsIdsString = useMemo(() => {
    if (!postsData?.pages) return '';
    return postsData.pages
      .map(page => page.posts?.map(p => p.id).join(',') || '')
      .join('|');
  }, [postsData?.pages]);

  const posts = useMemo(() => {
    if (!postsData?.pages) return [];

    const allPosts = postsData.pages.flatMap(page => page.posts);
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.id, post])).values()
    );

    // Only filter highlighted posts - place type and occupancy filtering is now done on server
    if (!showHighlightedPosts) {
      return uniquePosts.filter(post => !post.isHighlighted);
    }

    return uniquePosts;
    // FlashList potrebuje stabilnú referenciu na data array
    // Používame postsIdsString namiesto priameho mapovania v dependencies
  }, [postsIdsString, showHighlightedPosts]);

  const fetchMorePosts = async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  };

  // Force refetch that bypasses cache by invalidating the query first
  const forceRefetch = async () => {
    // Invalidate the query to force fresh data fetch
    await queryClient.invalidateQueries(queryKey);

    // Then refetch
    await refetch();
  };

  return {
    posts,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch: wrappedRefetch,
    forceRefetch,
    fetchMorePosts,
  };
};
