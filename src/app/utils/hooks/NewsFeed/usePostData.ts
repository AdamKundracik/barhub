import { useEffect, useMemo, useRef } from 'react';
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
  const { location, fakeLocation, useFakeLocation, isLocationLoading } =
    useLocationStore();
  const { placeId } = usePlaceStore();
  const { isAuthenticated } = useAuth();
  const userId = useUserStore(state => state.getUserId());
  const queryClient = useQueryClient();

  const currentLocation = useFakeLocation ? fakeLocation : location;

  // Query key už nezahŕňa polohu – zmena polohy sama o sebe nespustí refetch.
  // Data sa refetchnú:
  // - pri manuálnom pull-to-refresh / forceRefetch
  // - pri zmene filtrov/placeId
  // - keď expiroje staleTime (2 min)
  const queryKey = placeId
    ? ['posts', placeId, distance, selectedPlaces, selectedOccupancy]
    : ['posts', distance, selectedPlaces, selectedOccupancy, useFakeLocation];

  // Check if we're waiting for location (no location OR actively fetching)
  const isWaitingForLocation = !currentLocation || isLocationLoading;

  const {
    data: postsData,
    isFetchingNextPage,
    fetchNextPage,
    isLoading: isQueryLoading,
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
      // Plne manuálny režim refetchu pre feed:
      // - žiadny auto-refresh pri návrate do appky
      // - žiadny auto-refresh pri reconnecte siete
      // - žiadny auto-refresh pri mount-e
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      // Cache iba určuje, ako dlho sú dáta "platné" v pamäti/persistencii,
      // ale refetch sa spúšťa už len manuálne alebo cez invalidateQueries.
      staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
      cacheTime: 5 * 60 * 1000, // 5 minutes - cache lifetime
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

  // Show loading len pri úplne prvom loade (keď ešte nemáme žiadne posty).
  // Pri ďalších návratoch do appky už loader neskáče, aj keď sa refreshuje lokácia.
  const hasAnyPosts =
    !!postsData?.pages &&
    postsData.pages.some(
      page => Array.isArray(page.posts) && page.posts.length > 0
    );

  const isLoading = (isQueryLoading || isWaitingForLocation) && !hasAnyPosts;

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
