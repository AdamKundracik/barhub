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

  const {
    data: postsData,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    placeId 
      ? ['posts', placeId, currentLocation?.latitude, currentLocation?.longitude, distance] 
      : ['posts', currentLocation?.latitude, currentLocation?.longitude, distance],
    ({ pageParam = null }) =>
      handleFreshContent(distance, pageParam, placeId, currentLocation!),
    {
      getNextPageParam: lastPage => lastPage?.lastVisible || null, // lastVisible is mapped from nextCursor
      enabled: !!currentLocation && isAuthenticated, // Wait for both location and authentication
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
