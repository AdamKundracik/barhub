import { useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { handleFreshContent } from '../../functions/posts-functions';
import { useFiltersStore } from '../../store/filtersStorage';
import { useLocationStore } from '../../store/locationStore';
import { usePlaceStore } from '../../store/placesStore';
import {
  OccupancyTypes,
  PlaceType,
} from '@/src/app/utils/types/Feed/PostTypes';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { useUserStore } from '../../store/userStore';

export const useNewsFeedData = () => {
  const { distance, selectedPlaces, selectedOccupancy, showHighlightedPosts } = useFiltersStore();
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
    ? ['posts', placeId, roundedLat, roundedLong, distance] 
    : ['posts', roundedLat, roundedLong, distance];

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
    ({ pageParam = null }) =>
      handleFreshContent(distance, pageParam, placeId, currentLocation!),
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

  const filteredPosts = useMemo(() => {
    if (!postsData?.pages) return [];

    const allPosts = postsData.pages.flatMap(page => page.posts);
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.id, post])).values()
    );

    // First filter: Remove highlighted posts if showHighlightedPosts is false
    let postsAfterHighlightFilter = uniquePosts;
    if (!showHighlightedPosts) {
      postsAfterHighlightFilter = uniquePosts.filter(
        post => !post.isHighlighted
      );
    }

    // Second filter: Apply place type and occupancy filters
    if (selectedPlaces.length === 0 && selectedOccupancy.length === 0) {
      return postsAfterHighlightFilter;
    }

    return postsAfterHighlightFilter.filter(post => {
      const matchesPlaceType =
        selectedPlaces.length === 0 ||
        post.placeTypes?.some(type =>
          selectedPlaces.includes(type as PlaceType)
        );

      const matchesOccupancy =
        selectedOccupancy.length === 0 ||
        selectedOccupancy.includes(post.occupancy as OccupancyTypes);

      return matchesPlaceType && matchesOccupancy;
    });
  }, [postsData?.pages, selectedPlaces, selectedOccupancy, showHighlightedPosts]);

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
    posts: filteredPosts,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    forceRefetch,
    fetchMorePosts,
  };
};
