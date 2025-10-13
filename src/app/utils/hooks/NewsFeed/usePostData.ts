import { useMemo } from 'react';
import { useInfiniteQuery } from 'react-query';
import { handleFreshContent } from '../../functions/posts-functions';
import { useFiltersStore } from '../../store/filtersStorage';
import { useLocationStore } from '../../store/locationStore';
import { usePlaceStore } from '../../store/placesStore';
import {
  OccupancyTypes,
  PlaceType,
} from '@/src/app/utils/types/Feed/PostTypes';
import { useAuth } from '@/src/app/providers/AuthProvider';

export const useNewsFeedData = () => {
  const { distance, selectedPlaces, selectedOccupancy } = useFiltersStore();
  const { location, fakeLocation, useFakeLocation } = useLocationStore();
  const { placeId } = usePlaceStore();
  const { isAuthenticated } = useAuth();

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
      enabled: !!currentLocation && isAuthenticated, // Wait for both location and authentication
      refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
      refetchOnMount: false, // Don't refetch on mount if data exists (cache is cleared on logout)
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    }
  );

  const filteredPosts = useMemo(() => {
    if (!postsData?.pages) return [];

    const allPosts = postsData.pages.flatMap(page => page.posts);
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.id, post])).values()
    );

    if (selectedPlaces.length === 0 && selectedOccupancy.length === 0) {
      return uniquePosts;
    }

    return uniquePosts.filter(post => {
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
  }, [postsData?.pages, selectedPlaces, selectedOccupancy]);

  const fetchMorePosts = async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  };

  return {
    posts: filteredPosts,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchMorePosts,
  };
};
